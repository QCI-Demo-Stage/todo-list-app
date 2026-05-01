'use strict';

const { Pool } = require('pg');
const Database = require('better-sqlite3');

let dialect = 'sqlite';
let client = null;

function isPostgres() {
  const url = process.env.DATABASE_URL || '';
  return url.startsWith('postgres');
}

function ensureTasksTableSqlite(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

function ensureTasksTablePg() {
  return client.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function initDb() {
  if (isPostgres()) {
    dialect = 'postgres';
    client = new Pool({ connectionString: process.env.DATABASE_URL });
    await ensureTasksTablePg();
    return;
  }

  dialect = 'sqlite';
  const path = process.env.SQLITE_PATH || './data/dev.sqlite';
  client = new Database(path);
  ensureTasksTableSqlite(client);
}

function getDialect() {
  return dialect;
}

function getDb() {
  if (!client) {
    throw new Error('Database not initialized; call initDb() first');
  }
  return client;
}

async function closeDb() {
  if (!client) return;
  if (dialect === 'postgres') {
    await client.end();
  } else {
    client.close();
  }
  client = null;
}

module.exports = {
  initDb,
  getDb,
  getDialect,
  closeDb,
  isPostgres,
};
