import EmbeddedPostgres from 'embedded-postgres';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function startTestPostgres(port: number, database: string) {
  const directory = await mkdtemp(join(tmpdir(), 'dropthatuni-pg-'));
  const postgres = new EmbeddedPostgres({ databaseDir: directory, user: 'test_user', password: 'test-only-postgres-password', port,
    persistent: true, postgresFlags: ['-h', '127.0.0.1', '-k', directory], onLog: () => {}, onError: () => {} });
  try {
    await postgres.initialise(); await postgres.start(); await postgres.createDatabase(database);
  } catch (cause) { await postgres.stop().catch(() => {}); await rm(directory, { recursive: true, force: true }); throw cause; }
  return async () => { await postgres.stop(); await rm(directory, { recursive: true, force: true }); };
}
