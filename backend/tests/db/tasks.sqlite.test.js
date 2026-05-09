'use strict';

process.env.NODE_ENV = 'test';
process.env.SQLITE_PATH = ':memory:';

const { initDb, closeDb, getDialect } = require('../../src/db/index');
const {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../../src/db/tasks');

describe('tasks DB helpers (SQLite)', () => {
  beforeAll(async () => {
    await initDb();
    expect(getDialect()).toBe('sqlite');
  });

  afterAll(async () => {
    await closeDb();
  });

  test('create and list', async () => {
    const t = await createTask({ title: 'hello', completed: false });
    expect(t.title).toBe('hello');
    expect(t.completed).toBe(false);
    expect(t.id).toBeGreaterThan(0);
    const all = await listTasks();
    expect(all.some((x) => x.id === t.id)).toBe(true);
  });

  test('get by id', async () => {
    const created = await createTask({ title: 'g', completed: true });
    const found = await getTaskById(created.id);
    expect(found.title).toBe('g');
    expect(found.completed).toBe(true);
  });

  test('update partial fields', async () => {
    const created = await createTask({ title: 'orig', completed: false });
    const updated = await updateTask(created.id, { completed: true });
    expect(updated.completed).toBe(true);
    expect(updated.title).toBe('orig');
    const renamed = await updateTask(created.id, { title: 'renamed' });
    expect(renamed.title).toBe('renamed');
    expect(renamed.completed).toBe(true);
  });

  test('update missing returns null', async () => {
    const r = await updateTask(999999, { title: 'nope' });
    expect(r).toBeNull();
  });

  test('delete', async () => {
    const created = await createTask({ title: 'del', completed: false });
    const ok = await deleteTask(created.id);
    expect(ok).toBe(true);
    expect(await getTaskById(created.id)).toBeNull();
    expect(await deleteTask(created.id)).toBe(false);
  });
});
