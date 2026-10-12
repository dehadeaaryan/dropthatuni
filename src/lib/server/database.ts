import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

export const databasePath = resolve(env.DATABASE_PATH || 'data/dropthatuni.sqlite');
if (!building) mkdirSync(dirname(databasePath), { recursive: true });
export const db = new Database(building ? ':memory:' : databasePath, { create: true, strict: true });
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');

export function initializeWorkspaceTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminder_deliveries (
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      status TEXT NOT NULL,
      attempted_at INTEGER NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY(user_id, day)
    );
    CREATE TABLE IF NOT EXISTS workspaces (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      object_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS documents_owner ON documents(user_id);
    CREATE TABLE IF NOT EXISTS document_applications (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      application_id TEXT NOT NULL,
      PRIMARY KEY(document_id, application_id)
    );
  `);
}
