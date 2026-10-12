import { test, expect } from '@playwright/test';
import { createAccount } from './fixtures/account';

test('public demo edits stay in memory and reset without API calls', async ({ page }) => {
  const apiCalls: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiCalls.push(request.url()); });
  await page.goto('/demo');
  await expect(page.locator('.application-row')).toHaveCount(6);
  await expect(page.getByText('Demo · not saved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await page.getByLabel('Intake for Stanford University').fill('My demo intake');
  await page.getByRole('button', { name: 'Fees', exact: true }).click();
  await expect(page.locator('.fee-totals')).toContainText('$225.00');
  await page.getByRole('button', { name: 'Documents', exact: true }).click();
  await expect(page.getByText('Log in to upload and attach documents.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await expect(page.getByLabel('Intake for Stanford University')).not.toHaveValue('My demo intake');
  await page.getByLabel('Intake for Stanford University').fill('Temporary');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Clean', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(apiCalls).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('dropthatuni-workspace-v1'))).toBeNull();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('demo cannot change an existing account workspace', async ({ page }) => {
  await createAccount(page);
  const original = await (await page.request.get('/api/workspace')).json();
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await page.getByLabel('Intake for Stanford University').fill('Never save this');
  await page.getByRole('link', { name: 'DropThatUni home' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5293/');
  // Check before the landing's account autosave; demo data must never enter the account.
  await expect(page.getByRole('link', { name: 'Open workspace' })).toBeVisible();
  const saved = await (await page.request.get('/api/workspace')).json();
  expect(saved.workspace?.applications ?? []).toEqual(original.workspace?.applications ?? []);
  await page.getByRole('link', { name: 'Open workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Your shortlist starts here' })).toBeVisible();
});
