import { testData } from '../fixtures/workspace';
import { test, expect } from '@playwright/test';
import { type WorkspaceData } from '../../src/lib/model';
test('built Bun server persists accounts and accepts workspace imports above 512 KB', async ({ request, baseURL }) => {
  const signup = await request.post('/api/auth/sign-up/email', { headers: { Origin: baseURL! }, data: { name: 'Production Test', email: 'production@example.com', password: 'safe-production-test-password' } });
  expect(signup.ok()).toBeTruthy();
  expect(signup.headers()['set-cookie']).toContain('HttpOnly');
  const data: WorkspaceData = { version: 1, applications: [], fields: [], fees: [], view: 'clean', density: 'comfortable', checklist: 'summary', collapsed: false };
  const app = testData().applications[0];
  for (let i = 0; i < 50; i++) data.applications.push({ ...app, id: 'production-' + i, requirements: Array.from({ length: 100 }, (_, j) => ({ id: 'requirement-' + j, label: 'R'.repeat(100), done: false })), fields: {} });
  expect(Buffer.byteLength(JSON.stringify(data))).toBeGreaterThan(512 * 1024);
  const response = await request.put('/api/workspace', { headers: { Origin: baseURL! }, data });
  expect(response.ok()).toBeTruthy();
  expect((await (await request.get('/api/workspace')).json()).workspace.applications).toHaveLength(50);
  expect((await request.get('/import')).ok()).toBeTruthy();
});

test('readiness and proxy rate limits work without trusting spoofed IPs', async ({ request, baseURL }) => {
  const health = await request.get('/health', { headers: { 'x-forwarded-for': '' } });
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: 'ok' });
  expect(health.headers()['set-cookie']).toBeUndefined();
  expect((await request.get('/workspace', { maxRedirects: 0 })).status()).toBe(303);
  expect((await request.get('/api/workspace')).status()).toBe(401);
  expect((await request.get('/demo')).status()).toBe(200);
  for (let i = 0; i < 10; i++) {
    const response = await request.post('/api/auth/sign-in/email', {
      headers: { Origin: baseURL!, 'x-forwarded-for': `192.0.2.${i + 1}, 203.0.113.20`, 'x-dropthatuni-client-ip': `192.0.2.${i + 1}` },
      data: { email: 'missing@example.com', password: 'invalid-password' }
    });
    expect(response.status()).toBe(401);
  }
  const limited = await request.post('/api/auth/sign-in/email', { headers: { Origin: baseURL!, 'x-forwarded-for': '203.0.113.20' }, data: { email: 'missing@example.com', password: 'invalid-password' } });
  expect(limited.status()).toBe(429);
  const otherClient = await request.post('/api/auth/sign-in/email', { headers: { Origin: baseURL!, 'x-forwarded-for': '203.0.113.21' }, data: { email: 'missing@example.com', password: 'invalid-password' } });
  expect(otherClient.status()).toBe(401);
});

test('production does not serve credentials, database files, or server artifacts', async ({ request }) => {
  for (const path of ['/.env', '/.env.local', '/.env.test', '/.git/config', '/data/auth-secret', '/data/dropthatuni.sqlite', '/build/server/index.js', '/src/lib/server/auth.ts']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(await response.text()).not.toContain('production-test-only-secret-with-more-than-32-characters');
  }
});
