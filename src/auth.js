import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const passwordCost = 16_384;
const passwordBlockSize = 8;
const passwordParallelization = 1;
const passwordSaltBytes = 16;
const passwordHashBytes = 64;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dummyPasswordHash = [
  'scrypt',
  passwordCost,
  passwordBlockSize,
  passwordParallelization,
  Buffer.alloc(passwordSaltBytes).toString('base64url'),
  Buffer.alloc(passwordHashBytes).toString('base64url')
].join('$');

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function validateEmail(value) {
  if (typeof value !== 'string') throw new AuthError(400, 'A valid email address is required.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !emailPattern.test(email)) {
    throw new AuthError(400, 'A valid email address is required.');
  }
  return email;
}

export function validatePassword(value, { signup = false } = {}) {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > 128) {
    throw new AuthError(400, 'Password must be no more than 128 bytes.');
  }
  if (signup && value.length < 8) {
    throw new AuthError(400, 'Password must be at least 8 characters long.');
  }
  if (!signup && value.length === 0) throw new AuthError(400, 'Password is required.');
  return value;
}

export async function hashPassword(password) {
  const salt = randomBytes(passwordSaltBytes);
  const derivedKey = await scrypt(password, salt, passwordHashBytes, {
    N: passwordCost,
    r: passwordBlockSize,
    p: passwordParallelization,
    maxmem: 64 * 1024 * 1024
  });
  return [
    'scrypt',
    passwordCost,
    passwordBlockSize,
    passwordParallelization,
    salt.toString('base64url'),
    derivedKey.toString('base64url')
  ].join('$');
}

function parsePasswordHash(encoded) {
  if (typeof encoded !== 'string') return null;
  const [algorithm, cost, blockSize, parallelization, saltText, hashText, ...extra] = encoded.split('$');
  if (extra.length || algorithm !== 'scrypt'
    || Number(cost) !== passwordCost
    || Number(blockSize) !== passwordBlockSize
    || Number(parallelization) !== passwordParallelization) return null;
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(hashText, 'base64url');
  if (salt.length !== passwordSaltBytes || expected.length !== passwordHashBytes) return null;
  return { salt, expected };
}

export async function verifyPassword(password, encoded) {
  const parsed = parsePasswordHash(encoded);
  const { salt, expected } = parsed || parsePasswordHash(dummyPasswordHash);
  const actual = await scrypt(password, salt, passwordHashBytes, {
    N: passwordCost,
    r: passwordBlockSize,
    p: passwordParallelization,
    maxmem: 64 * 1024 * 1024
  });
  return Boolean(parsed && timingSafeEqual(actual, expected));
}

export function createSession(email, ttlMs, now = Date.now()) {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    key: createHash('sha256').update(token).digest('hex'),
    record: { email, expiresAt: new Date(now + ttlMs).toISOString() }
  };
}

export function getSessionKey(authorization) {
  if (typeof authorization !== 'string') return null;
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]{43})$/);
  if (!match) return null;
  return createHash('sha256').update(match[1]).digest('hex');
}

export function resolveSessionEmail(database, key, now = Date.now()) {
  if (!key) return null;
  if (!database.sessions || typeof database.sessions !== 'object' || Array.isArray(database.sessions)) {
    database.sessions = {};
  }
  const session = database.sessions[key];
  if (!session) return null;
  const expiresAt = Date.parse(session.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now
    || !database.users?.[session.email]?.passwordHash) {
    delete database.sessions[key];
    return null;
  }
  return session.email;
}
