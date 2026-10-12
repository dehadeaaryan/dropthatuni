import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('accounts and workspace survive a production process restart', async ({ playwright }) => {
  const directory = await mkdtemp(join(tmpdir(), 'dropthatuni-persistence-'));
  const origin = 'http://127.0.0.1:5296';
  const client = await playwright.request.newContext({ baseURL: origin, extraHTTPHeaders: { Origin: origin } });
  let server: ChildProcess | undefined;
  async function start() {
    server = spawn('bun', ['build/index.js'], { env: { ...process.env, NODE_ENV: 'production', PORT: '5296', HOST: '127.0.0.1', ORIGIN: origin, BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: 'restart-test-only-secret-with-more-than-32-characters', DATABASE_PATH: join(directory, 'workspace.sqlite'), ADDRESS_HEADER: '', XFF_DEPTH: '1', REMINDER_AUTO_RUN: 'false', RESEND_API_KEY: '', R2_BUCKET_NAME_DOCUMENTS: '' }, stdio: 'ignore' });
    await expect.poll(async () => { try { return (await client.get('/health')).status(); } catch { return 0; } }, { timeout: 10000 }).toBe(200);
  }
  async function stop() {
    if (!server || server.exitCode !== null || server.signalCode !== null) return;
    const exited = new Promise<void>(resolve => server!.once('exit', () => resolve()));
    server.kill('SIGTERM'); await exited;
  }
  try {
    await start();
    expect((await client.post('/api/auth/sign-up/email', { data: { name: 'Restart Test', email: 'restart@example.com', password: 'a-secure-restart-password' } })).ok()).toBeTruthy();
    const workspace = { version: 1, applications: [], fields: [{ id: 'saved-note', label: 'Survives restart', type: 'text', options: [], visible: true }], fees: [], view: 'table', density: 'compact', checklist: 'inline', collapsed: true };
    expect((await client.put('/api/workspace', { data: workspace })).ok()).toBeTruthy();
    await stop(); await start();
    const restored = await client.get('/api/workspace');
    expect(restored.status()).toBe(200);
    expect((await restored.json()).workspace).toEqual(workspace);
    expect((await client.post('/api/auth/sign-out', { data: {} })).ok()).toBeTruthy();
    expect((await client.post('/api/auth/sign-in/email', { data: { email: 'restart@example.com', password: 'a-secure-restart-password' } })).ok()).toBeTruthy();
    expect((await (await client.get('/api/workspace')).json()).workspace).toEqual(workspace);
  } finally { await stop(); await client.dispose(); await rm(directory, { recursive: true, force: true }); }
});
