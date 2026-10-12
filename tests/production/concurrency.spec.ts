import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';
import { isolatedDatabase } from '../fixtures/database';

test('concurrent app starts migrate safely and claim one reminder delivery', async ({ playwright }, testInfo) => {
  const database = await isolatedDatabase(testInfo.config.webServer!.env!.DATABASE_URL!);
  let delivered = 0;
  const email = createServer((request, response) => {
    request.resume();
    request.on('end', () => {
      delivered++;
      setTimeout(() => { response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ id: 'test-email-' + delivered })); }, 100);
    });
  });
  await new Promise<void>(resolve => email.listen(0, '127.0.0.1', resolve));
  const emailPort = (email.address() as { port: number }).port;
  const origin = 'http://127.0.0.1:5297';
  const client = await playwright.request.newContext({ baseURL: origin, extraHTTPHeaders: { Origin: origin, 'x-forwarded-for': '203.0.113.30' } });
  const servers: ChildProcess[] = [];
  try {
    for (const port of [5297, 5298]) servers.push(spawn('bun', ['build/index.js'], {
      env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port), ORIGIN: origin, BETTER_AUTH_URL: origin,
        DATABASE_URL: database.url,
        BETTER_AUTH_SECRET: 'concurrent-test-only-secret-with-more-than-32-characters', ADDRESS_HEADER: 'x-forwarded-for', XFF_DEPTH: '1',
        REMINDER_AUTO_RUN: 'false', REMINDER_CRON_SECRET: 'test-only-cron-secret', RESEND_API_KEY: 'test-only',
        REMINDER_FROM_EMAIL: 'DropThatUni <reminders@example.com>', RESEND_API_URL: 'http://127.0.0.1:' + emailPort, R2_BUCKET_NAME_DOCUMENTS: '' }, stdio: ['ignore', 'inherit', 'inherit'] }));
    for (const port of [5297, 5298]) await expect.poll(async () => { try { return (await client.get('http://127.0.0.1:' + port + '/health', { timeout: 1000 })).status(); } catch { return 0; } }, { timeout: 10000 }).toBe(200);
    const signup = await client.post('/api/auth/sign-up/email', { data: { name: 'Concurrent Test', email: 'concurrent@example.com', password: 'a-secure-concurrent-password' } });
    expect(signup.status(), await signup.text()).toBe(200);
    const today = new Date().toISOString().slice(0, 10);
    expect((await client.put('/api/workspace', { data: { version: 1, applications: [{ id: 'concurrent-application', university: 'Test University', program: 'MS', intake: 'Fall 2027', location: '', deadline: today, status: 'Considering', color: '#586c66', monogram: 'TU', archived: false, requirements: [], fields: {} }], fields: [], fees: [], view: 'clean', density: 'comfortable', checklist: 'summary', collapsed: false, reminders: { enabled: true, timezone: 'UTC', hour: 0, days: [0] } } })).ok()).toBeTruthy();
    const responses = await Promise.all([5297, 5298].map(port => client.post('http://127.0.0.1:' + port + '/api/reminders/run', { headers: { Authorization: 'Bearer test-only-cron-secret' } })));
    for (const response of responses) expect(response.status()).toBe(200);
    const results = await Promise.all(responses.map(response => response.json()));
    expect(results.reduce((sum, result) => sum + result.sent, 0)).toBe(1);
    expect(delivered).toBe(1);
  } finally {
    await Promise.all(servers.map(server => new Promise<void>(resolve => {
      if (server.exitCode !== null || server.signalCode !== null) { resolve(); return; }
      server.once('exit', () => resolve()); server.kill('SIGTERM');
    })));
    await client.dispose(); await new Promise<void>(resolve => email.close(() => resolve())); await database.cleanup();
  }
});
