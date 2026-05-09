'use strict';

const { getDb, getDialect } = require('./index');

function mapSqliteRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapPgRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    updated_at: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

async function listTasks() {
  const db = getDb();
  if (getDialect() === 'sqlite') {
    const rows = db.prepare('SELECT * FROM tasks ORDER BY id ASC').all();
    return rows.map(mapSqliteRow);
  }
  const { rows } = await db.query(
    'SELECT id, title, completed, created_at, updated_at FROM tasks ORDER BY id ASC'
  );
  return rows.map(mapPgRow);
}

async function getTaskById(id) {
  const db = getDb();
  if (getDialect() === 'sqlite') {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return mapSqliteRow(row);
  }
  const { rows } = await db.query(
    'SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = $1',
    [id]
  );
  return mapPgRow(rows[0]);
}

async function createTask({ title, completed }) {
  const db = getDb();
  if (getDialect() === 'sqlite') {
    const info = db
      .prepare(
        `INSERT INTO tasks (title, completed, updated_at)
         VALUES (?, ?, datetime('now'))`
      )
      .run(title, completed ? 1 : 0);
    return getTaskById(Number(info.lastInsertRowid));
  }
  const { rows } = await db.query(
    `INSERT INTO tasks (title, completed, updated_at)
     VALUES ($1, $2, NOW())
     RETURNING id, title, completed, created_at, updated_at`,
    [title, completed]
  );
  return mapPgRow(rows[0]);
}

async function updateTask(id, { title, completed }) {
  const db = getDb();
  const existing = await getTaskById(id);
  if (!existing) return null;

  const nextTitle = title !== undefined ? title : existing.title;
  const nextCompleted = completed !== undefined ? completed : existing.completed;

  if (getDialect() === 'sqlite') {
    db.prepare(
      `UPDATE tasks
       SET title = ?, completed = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(nextTitle, nextCompleted ? 1 : 0, id);
    return getTaskById(id);
  }
  const { rows } = await db.query(
    `UPDATE tasks
     SET title = $1, completed = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, title, completed, created_at, updated_at`,
    [nextTitle, nextCompleted, id]
  );
  return mapPgRow(rows[0]);
}

async function deleteTask(id) {
  const db = getDb();
  if (getDialect() === 'sqlite') {
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return info.changes > 0;
  }
  const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
