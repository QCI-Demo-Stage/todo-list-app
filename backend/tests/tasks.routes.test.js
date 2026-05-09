'use strict';

jest.mock('../src/db/tasks', () => ({
  listTasks: jest.fn(),
  getTaskById: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

process.env.SQLITE_PATH = ':memory:';

const request = require('supertest');
const tasksDb = require('../src/db/tasks');
const { createApp } = require('../src/app');

describe('/api/tasks routes', () => {
  let app;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET / lists tasks', async () => {
    tasksDb.listTasks.mockResolvedValue([{ id: 1, title: 'a', completed: false }]);
    const res = await request(app).get('/api/tasks').expect(200);
    expect(res.body).toEqual({
      success: true,
      data: [{ id: 1, title: 'a', completed: false }],
    });
  });

  test('GET /:id returns task', async () => {
    tasksDb.getTaskById.mockResolvedValue({
      id: 2,
      title: 'b',
      completed: true,
      created_at: 'x',
      updated_at: 'y',
    });
    const res = await request(app).get('/api/tasks/2').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(2);
  });

  test('GET /:id invalid id returns 400', async () => {
    const res = await request(app).get('/api/tasks/abc').expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('GET /:id missing returns 404', async () => {
    tasksDb.getTaskById.mockResolvedValue(null);
    const res = await request(app).get('/api/tasks/99').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('POST / creates task', async () => {
    tasksDb.createTask.mockResolvedValue({
      id: 3,
      title: 'new',
      completed: false,
      created_at: 'c',
      updated_at: 'u',
    });
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'new' })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(tasksDb.createTask).toHaveBeenCalledWith({ title: 'new', completed: false });
  });

  test('POST / validates body', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('PUT /:id updates task', async () => {
    tasksDb.updateTask.mockResolvedValue({
      id: 1,
      title: 'x',
      completed: true,
      created_at: 'c',
      updated_at: 'u',
    });
    const res = await request(app).put('/api/tasks/1').send({ completed: true }).expect(200);
    expect(tasksDb.updateTask).toHaveBeenCalledWith(1, { completed: true });
    expect(res.body.data.completed).toBe(true);
  });

  test('PUT /:id empty body returns 400', async () => {
    const res = await request(app).put('/api/tasks/1').send({}).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('PUT /:id not found returns 404', async () => {
    tasksDb.updateTask.mockResolvedValue(null);
    await request(app).put('/api/tasks/5').send({ title: 'z' }).expect(404);
  });

  test('DELETE /:id removes task', async () => {
    tasksDb.deleteTask.mockResolvedValue(true);
    const res = await request(app).delete('/api/tasks/4').expect(200);
    expect(res.body.data).toEqual({ deleted: true, id: 4 });
  });

  test('DELETE /:id not found returns 404', async () => {
    tasksDb.deleteTask.mockResolvedValue(false);
    await request(app).delete('/api/tasks/40').expect(404);
  });
});
