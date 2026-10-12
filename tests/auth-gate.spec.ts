import { test, expect } from '@playwright/test';
import { createAccount } from './fixtures/account';
import { testData } from './fixtures/workspace';
test('workspace and imports require a session before rendering or returning data', async ({ page, request }) => {
  for (const path of ['/workspace', '/import']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    expect(response.headers().location).toBe('/login?next=' + encodeURIComponent(path));
  }
  expect((await request.get('/api/workspace')).status()).toBe(401);
  expect((await request.put('/api/workspace', { data: {} })).status()).toBe(401);
  expect((await request.get('/api/documents')).status()).toBe(401);
  await page.goto('/workspace');
  await expect(page.getByRole('heading', { name: 'Log in.' })).toBeVisible();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await expect(page.locator('.application-row')).toHaveCount(0);
});

test('signup returns to requested page and logout closes access', async ({ page }) => {
  await page.goto('/import');
  await expect(page).toHaveURL(/\/login\?next=%2Fimport$/);
  await page.getByRole('button', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Gate User');
  await page.getByLabel('Email', { exact: true }).fill(crypto.randomUUID() + '@example.com');
  await page.getByLabel('Password', { exact: true }).fill('a-secure-password-123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/\/import$/);
  await expect(page.getByLabel('Workspace AI prompt')).toBeVisible();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5293/');
  expect((await page.request.get('/api/workspace')).status()).toBe(401);
  await page.goto('/workspace');
  await expect(page).toHaveURL(/\/login\?next=/);
});

test('failed account loading cannot overwrite stored workspace', async ({ page }) => {
  await createAccount(page, { version: 1, ...testData(), fees: [], view: 'clean', density: 'comfortable', checklist: 'summary', collapsed: false });
  let writes = 0;
  await page.route('**/api/workspace', route => {
    if (route.request().method() === 'PUT') writes++;
    return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/workspace');
  await expect(page.getByRole('alert')).toContainText('Could not connect');
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  expect(writes).toBe(0);
});
