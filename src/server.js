import { createServer as createHttpServer } from 'node:http';
import { analyzeFood } from './foodAnalysis.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJsonStore, createMongoStore } from './dataStore.js';
import {
  addScan,
  buildWellnessPlan,
  chatResponse,
  ensureUser,
  goalsResponse,
  resetDailyGoals,
  updateGoal,
  updateGoalPreferences,
  updateProfile
} from './domain.js';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultDataFile = path.resolve(moduleDirectory, '../data/nutriowl.json');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function sendJson(response, status, body, corsOrigin) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Cache-Control': 'no-store'
  });
  response.end(status === 204 ? undefined : JSON.stringify(body));
}

async function readJsonBody(request, maxBodyBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw httpError(413, 'Request body is too large.');
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('JSON body must be an object.');
    return body;
  } catch (error) {
    if (error.status) throw error;
    throw httpError(400, 'Request body must contain valid JSON.');
  }
}

function resolveUserEmail(request, defaultUserEmail) {
  const headerValue = String(request.headers['x-user-email'] || '').trim().toLowerCase();
  const email = headerValue || defaultUserEmail;
  if (!emailPattern.test(email) || email.length > 254) {
    throw httpError(400, 'A valid X-User-Email header is required.');
  }
  return email;
}

function errorStatus(error) {
  return Number.isInteger(error.status) ? error.status : 500;
}

export function createServer({
  dataFile = process.env.NUTRIOWL_DATA_FILE || defaultDataFile,
  mongoUri = process.env.MONGODB_URI || '',
  mongoDatabase = process.env.MONGODB_DATABASE,
  corsOrigin = process.env.CORS_ORIGIN || 'https://nutriowl.netlify.app',
  defaultUserEmail = process.env.DEFAULT_USER_EMAIL || 'demo@nutriowl.local',
  maxBodyBytes = 10 * 1024 * 1024
} = {}) {
  const store = mongoUri
    ? createMongoStore(mongoUri, mongoDatabase)
    : createJsonStore(dataFile);

  const server = createHttpServer(async (request, response) => {
    if (request.method === 'OPTIONS') return sendJson(response, 204, null, corsOrigin);
    const url = new URL(request.url || '/', 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(response, 200, { status: 'ok', service: 'nutriowl-api' }, corsOrigin);
    }
    if (!url.pathname.startsWith('/api/')) {
      return sendJson(response, 404, { error: 'Route not found.' }, corsOrigin);
    }

    try {
      const body = ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? await readJsonBody(request, maxBodyBytes)
        : {};

      if (request.method === 'POST' && url.pathname === '/api/food/analyze') {
        return sendJson(response, 200, await analyzeFood(body), corsOrigin);
      }
      if (request.method === 'POST' && url.pathname === '/api/chat') {
        const text = body.text ?? body.message;
        return sendJson(response, 200, { response: chatResponse(text) }, corsOrigin);
      }

      const email = resolveUserEmail(request, defaultUserEmail);
      const result = await store.transact(database => {
        const user = ensureUser(database, email);
        const method = request.method;
        const pathname = url.pathname;

        if (pathname === '/api/profile' && method === 'GET') return { status: 200, body: user.profile };
        if (pathname === '/api/profile' && ['POST', 'PUT'].includes(method)) {
          return { status: 200, body: updateProfile(user, body, email) };
        }
        if (pathname === '/api/goals' && method === 'GET') {
          resetDailyGoals(user);
          return { status: 200, body: goalsResponse(user) };
        }
        if (pathname === '/api/goals/generate' && method === 'POST') {
          user.goals.wellnessPlan = buildWellnessPlan(user.profile, user.goals.fruitPreference.servings, user.goals.hydrationReminder);
          user.goals.updatedAt = new Date().toISOString();
          return { status: 200, body: goalsResponse(user) };
        }
        if (pathname === '/api/goals/preferences' && method === 'PATCH') {
          return { status: 200, body: updateGoalPreferences(user, body) };
        }
        if (pathname.startsWith('/api/goals/') && method === 'PATCH') {
          const id = decodeURIComponent(pathname.slice('/api/goals/'.length));
          if (id.includes('/')) throw httpError(404, 'Route not found.');
          return { status: 200, body: updateGoal(user, id, body) };
        }
        if (pathname === '/api/scans' && method === 'GET') {
          return { status: 200, body: { scans: user.scans } };
        }
        if (pathname === '/api/scans' && method === 'POST') {
          const scan = addScan(user, body);
          return { status: 201, body: { scan, scans: user.scans } };
        }
        if (pathname === '/api/scans' && method === 'DELETE') {
          user.scans = [];
          user.profile.mealsScanned = 0;
          user.goalItems = user.goalItems.map(goal => goal.id === 'scan' ? { ...goal, progress: 0 } : goal);
          return { status: 200, body: { scans: [] } };
        }
        const scanMatch = pathname.match(/^\/api\/scans\/([^/]+)$/);
        if (scanMatch && method === 'GET') {
          const scan = user.scans.find(item => item.id === decodeURIComponent(scanMatch[1]));
          if (!scan) throw httpError(404, 'Scan not found.');
          return { status: 200, body: { scan } };
        }
        if (scanMatch && method === 'DELETE') {
          const id = decodeURIComponent(scanMatch[1]);
          const originalLength = user.scans.length;
          user.scans = user.scans.filter(item => item.id !== id);
          if (user.scans.length === originalLength) throw httpError(404, 'Scan not found.');
          user.profile.mealsScanned = user.scans.length;
          return { status: 200, body: { scans: user.scans } };
        }

        throw httpError(404, 'Route not found.');
      });

      return sendJson(response, result.status, result.body, corsOrigin);
    } catch (error) {
      const status = errorStatus(error);
      if (status >= 500) console.error('NutriOwl API request failed:', error);
      return sendJson(response, status, { error: status >= 500 ? 'The NutriOwl backend could not complete that request.' : error.message }, corsOrigin);
    }
  });

  server.on('close', () => {
    if (store.close) void store.close();
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.API_PORT || process.env.PORT || 3002);
  const server = createServer();
  server.listen(port, () => console.log(`NutriOwl API listening on http://localhost:${port}`));
}