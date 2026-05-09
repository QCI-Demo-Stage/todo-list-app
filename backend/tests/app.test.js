'use strict';

jest.mock('../src/db', () => ({
  ...jest.requireActual('../src/db'),
  initDb: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/db/tasks', () => ({
  listTasks: jest.fn(),
  getTaskById: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

const request = require('supertest');
const tasksDb = require('../src/db/tasks');
const { createApp } = require('../src/app');

describe('createApp middleware', () => {
  let app;

  beforeAll(async () => {
    app = await createApp();
  });

  test('unknown route returns standardized 404', async () => {
    const res = await request(app).get('/api/unknown-path').expect(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  test('route handler errors become 500 with sanitized message in production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    tasksDb.listTasks.mockRejectedValueOnce(new Error('secret db leak'));

    const fresh = await createApp();
    const res = await request(fresh).get('/api/tasks').expect(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('An unexpected error occurred');

    process.env.NODE_ENV = prev;
  });

  test('route handler errors expose message in development', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    tasksDb.listTasks.mockRejectedValueOnce(new Error('visible'));

    const fresh = await createApp();
    const res = await request(fresh).get('/api/tasks').expect(500);
    expect(res.body.error.message).toBe('visible');

    process.env.NODE_ENV = prev;
  });

  test('errors with statusCode pass through', async () => {
    const err = Object.assign(new Error('bad req'), { statusCode: 422, code: 'CUSTOM' });
    tasksDb.listTasks.mockRejectedValueOnce(err);

    const fresh = await createApp();
    const res = await request(fresh).get('/api/tasks').expect(422);
    expect(res.body.error.code).toBe('CUSTOM');
    expect(res.body.error.message).toBe('bad req');
  });
});
