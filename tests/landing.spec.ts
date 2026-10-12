import { createAccount } from './fixtures/account';
import type { WorkspaceData } from '../src/lib/model';
import { test, expect } from '@playwright/test';
import { testData } from './fixtures/workspace';

test('landing leads to an empty workspace and supports light/dark mobile layouts', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /One place to manage all your applications/ })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toContainText('DropThatUni');
  await expect(page.getByText('Start locally. Log in to save across devices.')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/landing-light.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.screenshot({ path: 'test-results/landing-dark.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Open workspace' }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await createAccount(page);
  await page.goto('/workspace');
  await expect(page.getByRole('heading', { name: 'Applications.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your shortlist starts here' })).toBeVisible();
  await expect(page.locator('.application-row')).toHaveCount(0);
  await expect(page.getByText('Sample data')).toHaveCount(0);
});

test('legacy sample cleanup keeps user-created programs', async ({ page }) => {
  const sample = testData().applications[0];
  const data = { version: 1, applications: [{ ...sample, id: 'demo-0' }, { ...sample, id: 'my-program', university: 'My University' }], fields: [], fees: [{ id: 'demo-fee', applicationId: 'demo-0', label: 'Fee', amount: 10, currency: 'USD', paid: false, dueDate: '' }], view: 'clean', density: 'comfortable', checklist: 'summary', collapsed: false };
  await page.addInitScript(value => { if (!localStorage.getItem('dropthatuni-workspace-v1')) localStorage.setItem('dropthatuni-workspace-v1', JSON.stringify(value)); }, data);
  await createAccount(page, data as WorkspaceData);
  await page.goto('/workspace');
  await expect(page.locator('.application-row')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Open My University', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Workspace', exact: true })).toHaveAttribute('href', '/workspace');
  const stored = (await (await page.request.get('/api/workspace')).json()).workspace;
  expect(stored.applications.map((a: { id: string }) => a.id)).toEqual(['my-program']);
  expect(stored.fees).toEqual([]);
});
