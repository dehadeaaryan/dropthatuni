import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { env } from '$env/dynamic/private';
import { building, dev } from '$app/environment';
import { repository } from './repository';
import { db, databasePath, initializeWorkspaceTables } from './database';

function secret() {
  if (env.BETTER_AUTH_SECRET) return env.BETTER_AUTH_SECRET;
  if (building) return 'build-only-placeholder-not-used-for-sessions';
  if (!dev) throw new Error('Set BETTER_AUTH_SECRET before running in production.');
  const path = join(dirname(databasePath), 'auth-secret');
  try { return readFileSync(path, 'utf8').trim(); }
  catch { const value = randomBytes(32).toString('hex'); writeFileSync(path, value, { mode: 0o600, flag: 'wx' }); return value; }
}

export const auth = betterAuth({
  appName: 'DropThatUni', database: db, secret: secret(),
  advanced: { ipAddress: { ipAddressHeaders: ['x-dropthatuni-client-ip'] } },
  baseURL: env.BETTER_AUTH_URL || { allowedHosts: ['localhost:*', '127.0.0.1:*'], protocol: 'http' },
  emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128 },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: !(dev && env.DROPTHATUNI_TEST_MODE === 'true'), storage: 'database', window: 60, max: 60,
    customRules: { '/sign-in/email': { window: 60, max: 10 }, '/sign-up/email': { window: 60, max: 5 } } }
});

export const authReady = (async () => {
  if (building) return;
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  initializeWorkspaceTables();
  await repository.removeSampleWorkspaces();
})();
