import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';

let postgres: EmbeddedPostgres | undefined;
let connection = process.env.DATABASE_URL;
if (!connection) {
  mkdirSync('data', { recursive: true });
  const secretFile = resolve('data/postgres-dev-password');
  const password = existsSync(secretFile) ? readFileSync(secretFile, 'utf8').trim() : randomBytes(32).toString('hex');
  if (!existsSync(secretFile)) writeFileSync(secretFile, password, { mode: 0o600, flag: 'wx' });
  const databaseDir = resolve('data/dev-postgres');
  postgres = new EmbeddedPostgres({ databaseDir, user: 'dropthatuni', password, port: 55435, persistent: true,
    postgresFlags: ['-h', '127.0.0.1', '-k', tmpdir()], onLog: () => {}, onError: () => {} });
  if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await postgres.initialise();
  await postgres.start();
  const client = postgres.getPgClient('postgres', '127.0.0.1');
  try {
    await client.connect();
    if (!(await client.query('SELECT 1 FROM pg_database WHERE datname = $1', ['dropthatuni'])).rowCount) await client.query('CREATE DATABASE dropthatuni');
  } finally { await client.end(); }
  connection = `postgresql://dropthatuni:${password}@127.0.0.1:55435/dropthatuni`;
}
const child = Bun.spawn(['bun', '--bun', 'vite', 'dev', ...process.argv.slice(2)], { env: { ...process.env, DATABASE_URL: connection }, stdout: 'inherit', stderr: 'inherit' });
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  child.kill('SIGTERM'); await child.exited;
  await postgres?.stop(); process.exit(0);
}
process.on('SIGTERM', () => void stop()); process.on('SIGINT', () => void stop());
const code = await child.exited;
if (!stopping) { await postgres?.stop(); process.exit(code); }
