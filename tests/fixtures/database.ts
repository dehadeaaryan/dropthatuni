import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';

export async function isolatedDatabase(connectionString: string) {
  const url = new URL(connectionString);
  url.pathname = '/postgres';
  const admin = new Pool({ connectionString: url.href, connectionTimeoutMillis: 5000 });
  const name = 'test_' + randomUUID().replaceAll('-', '');
  await admin.query(`CREATE DATABASE "${name}"`);
  url.pathname = '/' + name;
  return { url: url.href, async cleanup() {
    try { await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`); }
    finally { await admin.end(); }
  } };
}
