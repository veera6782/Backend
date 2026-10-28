import { createServer as createHttpServer } from 'node:http';
import { analyzeFood } from './foodAnalysis.js';
import { createChatClient } from './chat.js';
import {
  AuthError,
  createSession,
  getSessionKey,
  hashPassword,
  resolveSessionEmail,
  validateEmail,
  validatePassword,
  verifyPassword
} from './auth.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJsonStore, createMongoStore } from './dataStore.js';
import {
  addScan,
  buildWellnessPlan,
  ensureUser,
  goalsResponse,
  resetDailyGoals,
  updateGoal,
  updateGoalPreferences,
  updateProfile
} from './domain.js';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultDataFile = path.resolve(moduleDirectory, '../data/nutriowl.json');

function httpError(status, message) {
  return new AuthError(status, message);
}

function sendJson(response, status, body, corsOrigin) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

function errorStatus(error) {
  return Number.isInteger(error.status) ? error.status : 500;
}

export function createServer({
  dataFile = process.env.NUTRIOWL_DATA_FILE || defaultDataFile,
  mongoUri = process.env.MONGODB_URI || '',
  mongoDatabase = process.env.MONGODB_DATABASE,
  corsOrigin = process.env.CORS_ORIGIN || 'https://nutriowl.netlify.app',
  sessionTtlMs = Number(process.env.AUTH_SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000),
  maxBodyBytes = 10 * 1024 * 1024,
  chatClient = createChatClient()
} = {}) {
  if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs <= 0) {
    throw new Error('AUTH_SESSION_TTL_MS must be a positive integer.');
  }
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
      const pathname = url.pathname;

      if (request.method === 'POST' && ['/api/auth/signup', '/api/auth/signin'].includes(pathname)) {
        const email = validateEmail(body.email);
        const password = validatePassword(body.password, { signup: pathname === '/api/auth/signup' });

        if (pathname === '/api/auth/signup') {
          const passwordHash = await hashPassword(password);
          const session = createSession(email, sessionTtlMs);
          const result = await store.transact(database => {
            database.users ||= {};
            if (database.users[email]) {
              throw httpError(409, 'An account with this email already exists. Passwordless legacy accounts must be migrated before they can be used.');
            }
            const user = ensureUser(database, email);
            user.passwordHash = passwordHash;
            database.sessions ||= {};
            database.sessions[session.key] = session.record;
            return { token: session.token, profile: user.profile };
          });
          return sendJson(response, 201, result, corsOrigin);
        }

        const session = createSession(email, sessionTtlMs);
        const result = await store.transact(async database => {
          const user = database.users[email];
          if (!await verifyPassword(password, user?.passwordHash)) {
            throw httpError(401, 'Invalid email or password.');
          }
          database.sessions ||= {};
          database.sessions[session.key] = session.record;
          return { token: session.token, profile: user.profile };
        });
        return sendJson(response, 200, result, corsOrigin);
      }

      if (request.method === 'POST' && pathname === '/api/auth/signout') {
        const sessionKey = getSessionKey(request.headers.authorization);
        const result = await store.transact(database => {
          const email = resolveSessionEmail(database, sessionKey);
          if (!email) return { status: 401, body: { error: 'A valid bearer token is required.' } };
          delete database.sessions[sessionKey];
          return { status: 200, body: { success: true } };
        });
        return sendJson(response, result.status, result.body, corsOrigin);
      }

      if (request.method === 'POST' && pathname === '/api/food/analyze') {
        return sendJson(response, 200, await analyzeFood(body), corsOrigin);
      }
      if (request.method === 'POST' && pathname === '/api/chat') {
        // Signed-in members get personalized replies; anonymous requests remain supported.
        let user = null;
        let limitKey = `ip:${request.socket.remoteAddress}`;
        if (request.headers.authorization) {
          const sessionKey = getSessionKey(request.headers.authorization);
          const member = await store.transact(database => {
            const email = resolveSessionEmail(database, sessionKey);
            if (!email) return null;
            const record = ensureUser(database, email);
            resetDailyGoals(record);
            return structuredClone({ email, profile: record.profile, goalItems: record.goalItems, scans: record.scans });
          });
          if (!member) throw httpError(401, 'A valid bearer token is required.');
          user = member;
          limitKey = `user:${member.email}`;
        }
        return sendJson(response, 200, await chatClient.reply({ body, user, limitKey }), corsOrigin);
      }

      const sessionKey = getSessionKey(request.headers.authorization);
      const result = await store.transact(database => {
        const email = resolveSessionEmail(database, sessionKey);
        if (!email) return { status: 401, body: { error: 'A valid bearer token is required.' } };
        const user = ensureUser(database, email);
        const method = request.method;

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