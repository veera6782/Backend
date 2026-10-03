import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMongoStore } from '../src/dataStore.js';

test('MongoDB store persists transaction state in the NutriOwl collection', async () => {
  let document;
  let connected = false;
  let closed = false;

  const collection = {
    async updateOne(filter, update, options) {
      if (options?.upsert && !document) {
        document = { _id: filter._id, ...structuredClone(update.$setOnInsert) };
        return { matchedCount: 0 };
      }
      if (document?._revision !== filter._revision) return { matchedCount: 0 };
      document.state = structuredClone(update.$set.state);
      document._revision += update.$inc._revision;
      return { matchedCount: 1 };
    },
    async findOne() {
      return document && structuredClone(document);
    }
  };

  class MockMongoClient {
    constructor(uri) {
      assert.equal(uri, 'mongodb://example.test');
    }
    async connect() {
      connected = true;
    }
    db(databaseName) {
      assert.equal(databaseName, 'nutriowl-test');
      return {
        collection(name) {
          assert.equal(name, 'nutriowl_state');
          return collection;
        }
      };
    }
    async close() {
      closed = true;
    }
  }

  const store = createMongoStore('mongodb://example.test', 'nutriowl-test', MockMongoClient);
  const result = await store.transact(database => {
    database.users['member@example.test'] = { profile: { name: 'Member' } };
    return database.users['member@example.test'].profile.name;
  });

  assert.equal(result, 'Member');
  assert.equal(connected, true);
  assert.equal(document.state.users['member@example.test'].profile.name, 'Member');
  assert.equal(document._revision, 1);
  await store.close();
  assert.equal(closed, true);
});