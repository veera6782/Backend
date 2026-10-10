import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from '../src/server.js';

let server;
let baseUrl;
let temporaryDirectory;
let dataFile;

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'nutriowl-api-'));
  dataFile = path.join(temporaryDirectory, 'db.json');
  await writeFile(dataFile, JSON.stringify({
    version: 1,
    users: {
      'legacy@example.test': {
        profile: { email: 'legacy@example.test', name: 'Existing Member' },
        goals: { fruitPreference: { servings: 5 } },
        goalItems: [],
        scans: []
      }
    }
  }));
  server = createServer({ dataFile, mongoUri: '' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await rm(temporaryDirectory, { recursive: true, force: true });
});

async function api(pathname, { method = 'GET', token, headers = {}, body } = {}) {
  const requestHeaders = { ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

async function signup(email, password = 'secure-password-123') {
  return api('/api/auth/signup', { method: 'POST', body: { email, password } });
}

test('health is public while profile access requires a bearer session', async () => {
  const health = await api('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');

  const profile = await api('/api/profile', { headers: { 'X-User-Email': 'someone@example.test' } });
  assert.equal(profile.status, 401);
});

test('CORS allows the deployed NutriOwl frontend and auth preflight requests', async () => {
  const origin = 'https://nutriowl.netlify.app';
  const health = await fetch(`${baseUrl}/api/health`, { headers: { Origin: origin } });
  assert.equal(health.headers.get('access-control-allow-origin'), origin);

  const preflight = await fetch(`${baseUrl}/api/profile`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization'
    }
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization/i);
});

test('signup creates an account and duplicate signup is rejected', async () => {
  const created = await signup('signup@example.test');
  assert.equal(created.status, 201);
  assert.ok(created.body.token);
  assert.equal(created.body.profile.email, 'signup@example.test');
  const database = JSON.parse(await readFile(dataFile, 'utf8'));
  assert.match(database.users['signup@example.test'].passwordHash, /^scrypt\$/);
  assert.notEqual(database.users['signup@example.test'].passwordHash, 'secure-password-123');
  assert.equal(database.sessions[created.body.token], undefined);
  assert.equal((await signup('signup@example.test')).status, 409);

  const invalid = await signup('short-password@example.test', 'short');
  assert.equal(invalid.status, 400);
});

test('passwordless legacy accounts are not silently claimable', async () => {
  const result = await signup('legacy@example.test');
  assert.equal(result.status, 409);
  assert.match(result.body.error, /legacy accounts must be migrated/i);

  const database = JSON.parse(await readFile(dataFile, 'utf8'));
  assert.equal(database.users['legacy@example.test'].profile.name, 'Existing Member');
  assert.equal(database.users['legacy@example.test'].passwordHash, undefined);
});

test('signin accepts correct credentials and rejects invalid credentials', async () => {
  await signup('signin@example.test');

  const signedIn = await api('/api/auth/signin', {
    method: 'POST',
    body: { email: ' SIGNIN@example.test ', password: 'secure-password-123' }
  });
  assert.equal(signedIn.status, 200);
  assert.ok(signedIn.body.token);
  assert.equal(signedIn.body.profile.email, 'signin@example.test');

  const wrongPassword = await api('/api/auth/signin', {
    method: 'POST',
    body: { email: 'signin@example.test', password: 'wrong-password' }
  });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.body.error, 'Invalid email or password.');
});

test('profile and goals are scoped to the authenticated account', async () => {
  const account = await signup('onboarding@example.test');
  const saved = await api('/api/profile', {
    method: 'POST',
    token: account.body.token,
    body: {
      name: 'Taylor',
      email: 'onboarding@example.test',
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

  const changedEmail = await api('/api/profile', {
    method: 'PUT',
    token: account.body.token,
    body: { email: 'attacker@example.test' }
  });
  assert.equal(changedEmail.status, 400);

  const loaded = await api('/api/profile', { token: account.body.token });
  assert.equal(loaded.body.name, 'Taylor');
  assert.equal(loaded.body.onboardingCompleted, true);
  assert.equal(loaded.body.email, 'onboarding@example.test');

  const unauthenticated = await api('/api/goals');
  assert.equal(unauthenticated.status, 401);
  const initial = await api('/api/goals', { token: account.body.token });
  assert.equal(initial.status, 200);
  assert.equal(initial.body.goals.length, 6);
  assert.equal(initial.body.goals.find(goal => goal.id === 'fruits').target, 2);
});

test('goals can be generated, configured, and updated', async () => {
  const account = await signup('goals@example.test');
  const token = account.body.token;
  const preference = await api('/api/goals/preferences', {
    method: 'PATCH', token, body: { fruitPreference: { servings: 4 } }
  });
  assert.equal(preference.body.fruitPreference.servings, 4);
  assert.equal(preference.body.goals.find(goal => goal.id === 'fruits').target, 4);

  const updated = await api('/api/goals/protein', {
    method: 'PATCH', token, body: { increment: 12 }
  });
  assert.equal(updated.body.goals.find(goal => goal.id === 'protein').progress, 12);

  const generated = await api('/api/goals/generate', { method: 'POST', token });
  assert.equal(generated.status, 200);
  assert.ok(generated.body.wellnessPlan.generatedAt);
});

test('concurrent goal updates are serialized and progress is capped', async () => {
  const account = await signup('concurrency@example.test');
  await Promise.all(Array.from({ length: 8 }, () => api('/api/goals/protein', {
    method: 'PATCH', token: account.body.token, body: { increment: 10 }
  })));
  const goals = await api('/api/goals', { token: account.body.token });
  const protein = goals.body.goals.find(goal => goal.id === 'protein');
  assert.equal(protein.progress, protein.target);
});

test('scan history is also protected and persists across requests', async () => {
  const account = await signup('scans@example.test');
  const token = account.body.token;
  const created = await api('/api/scans', {
    method: 'POST', token, body: { name: 'Lentil bowl', calories: 360, protein: 22 }
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.scan.name, 'Lentil bowl');

  const profile = await api('/api/profile', { token });
  const goals = await api('/api/goals', { token });
  assert.equal(profile.body.mealsScanned, 1);
  assert.equal(goals.body.goals.find(goal => goal.id === 'scan').progress, 1);

  const removed = await api(`/api/scans/${created.body.scan.id}`, { method: 'DELETE', token });
  assert.equal(removed.status, 200);
  assert.equal(removed.body.scans.length, 0);
});

test('signout revokes the bearer session', async () => {
  const account = await signup('signout@example.test');
  const signedOut = await api('/api/auth/signout', { method: 'POST', token: account.body.token });
  assert.deepEqual(signedOut, { status: 200, body: { success: true } });

  const profile = await api('/api/profile', { token: account.body.token });
  assert.equal(profile.status, 401);
  const repeatedSignout = await api('/api/auth/signout', { method: 'POST', token: account.body.token });
  assert.equal(repeatedSignout.status, 401);
});

test('sessions expire and reject invalid bearer tokens', async () => {
  const expiringServer = createServer({
    dataFile: path.join(temporaryDirectory, 'expiring.json'),
    mongoUri: '',
    sessionTtlMs: 500
  });
  await new Promise(resolve => expiringServer.listen(0, '127.0.0.1', resolve));
  const expiringUrl = `http://127.0.0.1:${expiringServer.address().port}`;
  try {
    const signupResponse = await fetch(`${expiringUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'expiring@example.test', password: 'secure-password-123' })
    });
    const account = await signupResponse.json();
    assert.equal(signupResponse.status, 201);

    const validResponse = await fetch(`${expiringUrl}/api/profile`, {
      headers: { Authorization: `Bearer ${account.token}` }
    });
    assert.equal(validResponse.status, 200);
    await new Promise(resolve => setTimeout(resolve, 550));

    const expiredResponse = await fetch(`${expiringUrl}/api/profile`, {
      headers: { Authorization: `Bearer ${account.token}` }
    });
    assert.equal(expiredResponse.status, 401);
    const malformedResponse = await fetch(`${expiringUrl}/api/profile`, {
      headers: { Authorization: 'Bearer invalid' }
    });
    assert.equal(malformedResponse.status, 401);
  } finally {
    await new Promise((resolve, reject) => expiringServer.close(error => error ? reject(error) : resolve()));
  }
});

test('chat and food analysis remain public and frontend-compatible', async () => {
  const chat = await api('/api/chat', { method: 'POST', body: { text: 'What are some protein foods?' } });
  assert.equal(chat.status, 200);
  assert.match(chat.body.response, /protein/i);

  const food = await api('/api/food/analyze', { method: 'POST', body: { image: 'sample' } });
  assert.equal(food.status, 200);
  assert.equal(food.body.isSample, true);
  assert.equal(food.body.food, 'Chicken Salad');
});

test('invalid input returns a useful client error', async () => {
  const account = await signup('validation@example.test');
  const invalid = await api('/api/goals/preferences', {
    method: 'PATCH',
    token: account.body.token,
    body: { fruitPreference: { servings: 99 } }
  });
  assert.equal(invalid.status, 400);
  assert.match(invalid.body.error, /integer from 1 to 10/);
});
