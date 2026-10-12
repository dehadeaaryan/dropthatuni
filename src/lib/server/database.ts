import { Pool, type PoolClient } from 'pg';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

if (!building && !env.DATABASE_URL) throw new Error('Set DATABASE_URL to your PostgreSQL connection URL.');
if (env.DATABASE_URL) {
  try {
    const url = new URL(env.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error();
  } catch { throw new Error('DATABASE_URL must be a valid PostgreSQL URL with a database name.'); }
}
export const db = new Pool({
  connectionString: env.DATABASE_URL || 'postgresql://localhost/build-placeholder',
  max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000
});
db.on('error', () => console.error('PostgreSQL connection error.'));

export async function initializeWorkspaceTables(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS reminder_deliveries (
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      status TEXT NOT NULL,
      attempted_at BIGINT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY(user_id, day)
    );
    CREATE TABLE IF NOT EXISTS workspaces (
      user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      object_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size BIGINT NOT NULL,
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS documents_owner ON documents(user_id);
    CREATE TABLE IF NOT EXISTS document_applications (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      application_id TEXT NOT NULL,
      PRIMARY KEY(document_id, application_id)
    );
  `);
}
