'use strict';

const knex = require('knex');

/**
 * Builds Knex configuration from environment.
 * - Production: PostgreSQL (`pg`), using `DATABASE_URL` or `PG*` variables.
 * - Non-production: SQLite (`sqlite3`) for local development.
 */
function createKnexConfig() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const connection = process.env.DATABASE_URL
      ? process.env.DATABASE_URL
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT, 10) || 5432,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          ssl:
            process.env.PGSSL === 'true'
              ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' }
              : false,
        };

    return {
      client: 'pg',
      connection,
      pool: { min: 0, max: parseInt(process.env.PGPOOL_MAX, 10) || 10 },
    };
  }

  return {
    client: 'sqlite3',
    connection: {
      filename: process.env.SQLITE_PATH || './data/dev.sqlite3',
    },
    useNullAsDefault: true,
  };
}

let knexInstance;

function getDb() {
  if (!knexInstance) {
    knexInstance = knex(createKnexConfig());
  }
  return knexInstance;
}

/**
 * Run a callback inside a transaction. The callback receives the transaction object (`trx`).
 * @param {(trx: import('knex').Knex.Transaction) => Promise<unknown> | unknown} handler
 * @returns {Promise<unknown>}
 */
function withTransaction(handler) {
  return getDb().transaction(handler);
}

/**
 * Execute a function with a Knex query builder scoped to a table.
 * @param {string} table
 * @param {(qb: import('knex').Knex.QueryBuilder) => Promise<unknown> | unknown} fn
 */
async function withTable(table, fn) {
  const qb = getDb()(table);
  return fn(qb);
}

/**
 * Gracefully close the database connection pool (required for clean test/process exit).
 */
async function closeDb() {
  if (knexInstance) {
    await knexInstance.destroy();
    knexInstance = undefined;
  }
}

/**
 * Reset singleton (mainly for tests).
 */
function resetDbForTests() {
  knexInstance = undefined;
}

module.exports = {
  createKnexConfig,
  getDb,
  withTransaction,
  withTable,
  closeDb,
  resetDbForTests,
};
