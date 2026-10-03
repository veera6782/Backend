import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from '../src/server.js';

let server;
let baseUrl;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'nutriowl-api-'));
  server = createServer({ dataFile: path.join(temporaryDirectory, 'db.json'), mongoUri: '' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await rm(temporaryDirectory, { recursive: true, force: true });
});

async function api(pathname, { method = 'GET', email, body } = {}) {
  const headers = {};
  if (email) headers['X-User-Email'] = email;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

test('health and profile endpoints work without a frontend session', async () => {
  const health = await api('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');

  const profile = await api('/api/profile');
  assert.equal(profile.status, 200);
  assert.equal(profile.body.email, 'demo@nutriowl.local');
});

test('CORS allows the deployed NutriOwl frontend and its preflight requests', async () => {
  const origin = 'https://nutriowl.netlify.app';
  const health = await fetch(`${baseUrl}/api/health`, { headers: { Origin: origin } });
  assert.equal(health.headers.get('access-control-allow-origin'), origin);

  const preflight = await fetch(`${baseUrl}/api/profile`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,x-user-email'
    }
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
});

test('profile is saved per email and accepts onboarding fields', async () => {
  const email = 'onboarding@example.test';
  const saved = await api('/api/profile', {
    method: 'POST',
    email,
    body: {
      name: 'Taylor',
      email,
      age: '24',
      height: '172',
      weight: '68',
      activityLevel: 'moderate',
      goals: ['balanced', 'energy'],
      onboardingCompleted: true
    }
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.heightCm, 172);
  assert.equal(saved.body.goal, 'balanced');
  assert.deepEqual(saved.body.goals, ['balanced', 'energy']);

  const loaded = await api('/api/profile', { email });
  assert.equal(loaded.body.name, 'Taylor');
  assert.equal(loaded.body.onboardingCompleted, true);
  assert.equal((await api('/api/profile', { email: 'other@example.test' })).body.name, 'NutriOwl Member');
});

test('goals can be generated, configured, and updated', async () => {
  const email = 'goals@example.test';
  const initial = await api('/api/goals', { email });
  assert.equal(initial.status, 200);
  assert.equal(initial.body.goals.length, 6);
  assert.equal(initial.body.goals.find(goal => goal.id === 'fruits').target, 2);

  const preference = await api('/api/goals/preferences', {
    method: 'PATCH', email, body: { fruitPreference: { servings: 4 } }
  });
  assert.equal(preference.body.fruitPreference.servings, 4);
  assert.equal(preference.body.goals.find(goal => goal.id === 'fruits').target, 4);

  const updated = await api('/api/goals/protein', {
    method: 'PATCH', email, body: { increment: 12 }
  });
  assert.equal(updated.body.goals.find(goal => goal.id === 'protein').progress, 12);

  const generated = await api('/api/goals/generate', { method: 'POST', email });
  assert.equal(generated.status, 200);
  assert.ok(generated.body.wellnessPlan.generatedAt);
});

test('concurrent goal updates are serialized and progress is capped', async () => {
  const email = 'concurrency@example.test';
  await Promise.all(Array.from({ length: 8 }, () => api('/api/goals/protein', {
    method: 'PATCH', email, body: { increment: 10 }
  })));
  const goals = await api('/api/goals', { email });
  const protein = goals.body.goals.find(goal => goal.id === 'protein');
  assert.equal(protein.progress, protein.target);
});

test('scan history persists and updates scan totals', async () => {
  const email = 'scans@example.test';
  const created = await api('/api/scans', {
    method: 'POST', email, body: { name: 'Lentil bowl', calories: 360, protein: 22 }
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.scan.name, 'Lentil bowl');

  const profile = await api('/api/profile', { email });
  const goals = await api('/api/goals', { email });
  assert.equal(profile.body.mealsScanned, 1);
  assert.equal(goals.body.goals.find(goal => goal.id === 'scan').progress, 1);

  const removed = await api(`/api/scans/${created.body.scan.id}`, { method: 'DELETE', email });
  assert.equal(removed.status, 200);
  assert.equal(removed.body.scans.length, 0);
});

test('chat and demo food analysis return frontend-compatible results', async () => {
  const chat = await api('/api/chat', { method: 'POST', body: { text: 'What are some protein foods?' } });
  assert.equal(chat.status, 200);
  assert.match(chat.body.response, /protein/i);

  const food = await api('/api/food/analyze', { method: 'POST', body: { image: 'sample' } });
  assert.equal(food.status, 200);
  assert.equal(food.body.isSample, true);
  assert.equal(food.body.food, 'Chicken Salad');
});

test('invalid input returns a useful client error', async () => {
  const invalid = await api('/api/goals/preferences', {
    method: 'PATCH', email: 'validation@example.test', body: { fruitPreference: { servings: 99 } }
  });
  assert.equal(invalid.status, 400);
  assert.match(invalid.body.error, /integer from 1 to 10/);
});