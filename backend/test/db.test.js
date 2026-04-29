'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');

const {
  createKnexConfig,
  getDb,
  closeDb,
  resetDbForTests,
} = require('../src/db.js');

test.afterEach(() => {
  process.env.NODE_ENV = 'test';
});

test('createKnexConfig uses PostgreSQL in production', () => {
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgres://u:p@localhost:5432/db';
  const cfg = createKnexConfig();
  assert.strictEqual(cfg.client, 'pg');
  assert.strictEqual(cfg.connection, process.env.DATABASE_URL);
  delete process.env.DATABASE_URL;
});

test('createKnexConfig uses SQLite outside production', () => {
  process.env.NODE_ENV = 'development';
  delete process.env.DATABASE_URL;
  const cfg = createKnexConfig();
  assert.strictEqual(cfg.client, 'sqlite3');
  assert.ok(cfg.connection.filename);
  assert.strictEqual(cfg.useNullAsDefault, true);
});

test('getDb and closeDb work with SQLite', async () => {
  resetDbForTests();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dbtest-'));
  const file = path.join(dir, 'test.sqlite3');
  process.env.NODE_ENV = 'development';
  process.env.SQLITE_PATH = file;

  const db = getDb();
  const hasSmoke = await db.schema.hasTable('_smoke');
  if (!hasSmoke) {
    await db.schema.createTable('_smoke', (t) => {
      t.increments('id');
    });
  }
  const rows = await db('_smoke').select('*');
  assert.strictEqual(rows.length, 0);

  await closeDb();
  resetDbForTests();
  delete process.env.SQLITE_PATH;
  await fs.rm(dir, { recursive: true, force: true });
});
