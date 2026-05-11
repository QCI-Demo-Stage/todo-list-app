'use strict';

const express = require('express');
const { initDb } = require('./db');
const { fail } = require('./utils/responses');
const tasksRouter = require('./routes/tasks');

async function createApp() {
  await initDb();

  const app = express();
  app.use(express.json());

  app.use('/api/tasks', tasksRouter);

  app.use((req, res) => {
    return fail(res, 404, 'NOT_FOUND', 'Route not found');
  });

  app.use((err, req, res, next) => {
    const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    const code = status === 500 ? 'INTERNAL_ERROR' : err.code || 'ERROR';
    const message =
      status === 500 && process.env.NODE_ENV !== 'development'
        ? 'An unexpected error occurred'
        : err.message || 'Error';
    return fail(res, status, code, message);
  });

  return app;
}

module.exports = { createApp };
