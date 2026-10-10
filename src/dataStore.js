import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';

async function readDatabase(filePath) {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Database root must be a JSON object.');
    }
    if (!parsed.users || typeof parsed.users !== 'object' || Array.isArray(parsed.users)) {
      parsed.users = {};
    }
    if (!parsed.sessions || typeof parsed.sessions !== 'object' || Array.isArray(parsed.sessions)) {
      parsed.sessions = {};
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, users: {}, sessions: {} };
    throw error;
  }
}

async function writeDatabase(filePath, database) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, JSON.stringify(database, null, 2), { mode: 0o600 });
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
}

export function createJsonStore(filePath) {
  let queue = Promise.resolve();

  return {
    transact(operation) {
      const result = queue.then(async () => {
        const database = await readDatabase(filePath);
        const value = await operation(database);
        await writeDatabase(filePath, database);
        return value;
      });
      queue = result.catch(() => undefined);
      return result;
    }
  };
}

export function createMongoStore(uri, databaseName, MongoClientImplementation = MongoClient) {
  const client = new MongoClientImplementation(uri);
  let collectionPromise;
  let queue = Promise.resolve();

  async function getCollection() {
    if (!collectionPromise) {
      collectionPromise = (async () => {
        await client.connect();
        const database = databaseName ? client.db(databaseName) : client.db();
        return database.collection('nutriowl_state');
      })();
    }
    return collectionPromise;
  }

  return {
    close() {
      return client.close();
    },
    transact(operation) {
      const result = queue.then(async () => {
        const collection = await getCollection();
        await collection.updateOne(
          { _id: 'primary' },
          { $setOnInsert: { _revision: 0, state: { version: 1, users: {}, sessions: {} } } },
          { upsert: true }
        );

        for (let attempt = 0; attempt < 10; attempt += 1) {
          const record = await collection.findOne({ _id: 'primary' });
          if (!record || !record.state || !Number.isInteger(record._revision)) {
            throw new Error('MongoDB NutriOwl state document is invalid.');
          }

          const value = await operation(record.state);
          const update = await collection.updateOne(
            { _id: 'primary', _revision: record._revision },
            { $set: { state: record.state }, $inc: { _revision: 1 } }
          );
          if (update.matchedCount === 1) return value;
        }

        throw new Error('MongoDB state changed too often; transaction could not be committed.');
      });
      queue = result.catch(() => undefined);
      return result;
    }
  };
}