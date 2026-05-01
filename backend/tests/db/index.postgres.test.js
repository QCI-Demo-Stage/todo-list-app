'use strict';

const mockQuery = jest.fn();
const mockEnd = jest.fn().mockResolvedValue(undefined);

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockQuery,
    end: mockEnd,
  })),
}));

describe('db/index PostgreSQL branch', () => {
  const pgUrl = 'postgresql://user:pass@localhost:5432/db';

  beforeEach(() => {
    jest.resetModules();
    mockQuery.mockReset();
    mockEnd.mockClear();
    delete process.env.SQLITE_PATH;
    process.env.DATABASE_URL = pgUrl;
  });

  afterEach(async () => {
    const { closeDb } = require('../../src/db/index');
    await closeDb();
    delete process.env.DATABASE_URL;
    jest.resetModules();
  });

  test('initDb creates tasks table via Postgres', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const { initDb, getDialect } = require('../../src/db/index');
    await initDb();
    expect(getDialect()).toBe('postgres');
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS tasks'));
  });

  test('getDb throws before init', () => {
    jest.resetModules();
    delete process.env.DATABASE_URL;
    const { getDb } = require('../../src/db/index');
    expect(() => getDb()).toThrow(/not initialized/);
  });

  test('closeDb when not initialized is a no-op', async () => {
    jest.resetModules();
    delete process.env.DATABASE_URL;
    const { closeDb } = require('../../src/db/index');
    await expect(closeDb()).resolves.toBeUndefined();
  });
});
