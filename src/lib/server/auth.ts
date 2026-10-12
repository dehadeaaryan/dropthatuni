import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { env } from '$env/dynamic/private';
import { building, dev } from '$app/environment';
import { repository } from './repository';
import { db, initializeWorkspaceTables } from './database';

function secret() {
  if (env.BETTER_AUTH_SECRET) return env.BETTER_AUTH_SECRET;
  if (building) return 'build-only-placeholder-not-used-for-sessions';
  if (!dev) throw new Error('Set BETTER_AUTH_SECRET before running in production.');
  mkdirSync('data', { recursive: true });
  const path = resolve('data/auth-secret');
  try { return readFileSync(path, 'utf8').trim(); }
  catch { const value = randomBytes(32).toString('hex'); writeFileSync(path, value, { mode: 0o600, flag: 'wx' }); return value; }
}

const options: BetterAuthOptions = {
  appName: 'DropThatUni', database: db, secret: secret(),
  advanced: { ipAddress: { ipAddressHeaders: ['x-dropthatuni-client-ip'] } },
  baseURL: env.BETTER_AUTH_URL || { allowedHosts: ['localhost:*', '127.0.0.1:*'], protocol: 'http' },
  emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128 },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: !(dev && env.DROPTHATUNI_TEST_MODE === 'true'), storage: 'database', window: 60, max: 60,
    customRules: { '/sign-in/email': { window: 60, max: 10 }, '/sign-up/email': { window: 60, max: 5 } } }
};

async function migrate() {
  const client = await db.connect();
  try {
    // Construct runtime auth only after migrations. Better Auth caches schema
    // validation, so creating it while another replica migrates can poison it.
    await client.query('SELECT pg_advisory_lock(814723915)');
    const migrationAuth = betterAuth({ ...options, logger: { disabled: true } });
    const { runMigrations } = await getMigrations(migrationAuth.options);
    await runMigrations();
    await client.query('BEGIN');
    await initializeWorkspaceTables(client);
    await client.query('COMMIT');
  } catch (cause) { await client.query('ROLLBACK').catch(() => {}); throw cause; }
  finally {
    await client.query('SELECT pg_advisory_unlock(814723915)').catch(() => {});
    client.release();
  }
}

if (!building) await migrate();

export const auth = betterAuth(options);
export const authReady = (async () => {
  if (building) return;
  await repository.removeSampleWorkspaces();
})();
