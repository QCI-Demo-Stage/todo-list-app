'use strict';

const mockQuery = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockQuery,
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('tasks DB helpers (PostgreSQL)', () => {
  const pgUrl = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(async () => {
    jest.resetModules();
    mockQuery.mockReset();
    delete process.env.SQLITE_PATH;
    process.env.DATABASE_URL = pgUrl;

    const { initDb } = require('../../src/db/index');
    mockQuery.mockResolvedValue({ rows: [] });
    await initDb();
    mockQuery.mockReset();
  });

  afterEach(async () => {
    const { closeDb } = require('../../src/db/index');
    await closeDb();
    delete process.env.DATABASE_URL;
    jest.resetModules();
  });

  test('listTasks maps rows', async () => {
    const created = new Date('2026-01-01T00:00:00.000Z');
    const updated = new Date('2026-01-02T00:00:00.000Z');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, title: 't', completed: true, created_at: created, updated_at: updated }],
    });
    const { listTasks } = require('../../src/db/tasks');
    const list = await listTasks();
    expect(list).toEqual([
      {
        id: 1,
        title: 't',
        completed: true,
        created_at: created.toISOString(),
        updated_at: updated.toISOString(),
      },
    ]);
  });

  test('getTaskById returns null when missing', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { getTaskById } = require('../../src/db/tasks');
    expect(await getTaskById(9)).toBeNull();
  });

  test('createTask uses RETURNING row', async () => {
    const created = new Date('2026-01-01T00:00:00.000Z');
    const updated = new Date('2026-01-01T00:00:01.000Z');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, title: 'new', completed: false, created_at: created, updated_at: updated }],
    });
    const { createTask } = require('../../src/db/tasks');
    const row = await createTask({ title: 'new', completed: false });
    expect(row.id).toBe(5);
    expect(mockQuery.mock.calls[0][0]).toContain('RETURNING');
  });

  test('updateTask returns null when task missing', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { updateTask } = require('../../src/db/tasks');
    expect(await updateTask(404, { title: 'x' })).toBeNull();
  });

  test('updateTask merges partial payload', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, title: 'old', completed: false, created_at: new Date(), updated_at: new Date() }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1, title: 'new', completed: true, created_at: new Date(), updated_at: new Date() }],
      });
    const { updateTask } = require('../../src/db/tasks');
    const row = await updateTask(1, { title: 'new', completed: true });
    expect(row.title).toBe('new');
    expect(row.completed).toBe(true);
  });

  test('deleteTask reflects rowCount', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const { deleteTask } = require('../../src/db/tasks');
    expect(await deleteTask(3)).toBe(true);

    mockQuery.mockResolvedValueOnce({ rowCount: 0 });
    expect(await deleteTask(3)).toBe(false);
  });
});
