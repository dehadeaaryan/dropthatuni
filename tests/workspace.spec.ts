import { createAccount } from './fixtures/account';
import { testData } from './fixtures/workspace';
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await createAccount(page, { version: 1, ...testData(), fees: [], view: 'clean', density: 'comfortable', checklist: 'summary', collapsed: false });
});

test('clean view, details, custom fields and edits survive reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[svelte]')) errors.push(message.text()); });
  await page.goto('/workspace');
  await expect(page.getByRole('button', { name: 'Clean', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Open Stanford University', exact: true }).click();
  const detail = page.getByRole('dialog', { name: 'Application', exact: true });
  await detail.getByLabel('Status', { exact: true }).selectOption('Awaiting references');
  await detail.getByRole('button', { name: /Checklist/ }).click();
  await detail.getByLabel('New requirement').fill('Portfolio');
  await detail.getByRole('button', { name: 'Add requirement', exact: true }).click();
  await detail.getByLabel('Portfolio for Stanford University', { exact: true }).check();
  await detail.getByRole('button', { name: 'Details', exact: true }).click();
  await detail.getByRole('button', { name: 'Add field', exact: true }).click();
  const fields = page.getByRole('dialog', { name: 'Fields & columns' });
  await fields.getByLabel('Name', { exact: true }).fill('My score');
  await fields.getByLabel('Type', { exact: true }).selectOption('number');
  await fields.getByRole('button', { name: 'Add field', exact: true }).click();
  await fields.getByRole('button', { name: 'Close', exact: true }).click();
  await detail.getByLabel('My score', { exact: true }).fill('9');
  await detail.getByRole('button', { name: 'Close', exact: true }).click();
  await page.waitForTimeout(400);
  await page.reload();
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'My score' })).toBeVisible();
  await expect(page.getByLabel('My score', { exact: true }).first()).toHaveValue('9');
  await expect(page.getByLabel('Status for Stanford University')).toHaveValue('Awaiting references');
  await page.getByLabel('Show checklist').check();
  await expect(page.getByLabel('Portfolio for Stanford University', { exact: true })).toBeChecked();
  expect(errors).toEqual([]);
});

test('add a program, rank it and archive it', async ({ page }) => {
  await page.goto('/workspace');
  await page.getByRole('button', { name: 'Add program', exact: true }).first().click();
  const add = page.getByRole('dialog', { name: 'Add program' });
  await add.getByLabel('University', { exact: true }).fill('Test University');
  await add.getByLabel('Program', { exact: true }).fill('MSc · AI');
  await add.getByRole('button', { name: 'Add program', exact: true }).click();
  const detail = page.getByRole('dialog', { name: 'Application', exact: true });
  await expect(detail.getByLabel('University name')).toHaveValue('Test University');
  await detail.getByRole('button', { name: 'Move ranking up' }).click();
  await detail.getByRole('button', { name: 'Close', exact: true }).click();
  const handle = page.getByRole('button', { name: /Drag to rank Test University/ });
  await handle.focus();
  await handle.press('ArrowUp');
  await expect(page.locator('.application-row').nth(4)).toContainText('Test University');
  await page.getByRole('button', { name: 'Open Test University', exact: true }).click();
  await detail.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.locator('.application-list')).not.toContainText('Test University');
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.locator('.application-list')).toContainText('Test University');
});

test('drag rankings and toggle checklist, density and sidebar', async ({ page }) => {
  await page.goto('/workspace');
  await page.getByRole('button', { name: /Drag to rank Carnegie Mellon/ }).dragTo(page.locator('.application-row').first());
  await expect(page.locator('.application-row').first()).toContainText('Carnegie Mellon');
  await page.getByLabel('Show checklist').check();
  await page.getByLabel('Reference 1 for Carnegie Mellon University', { exact: true }).uncheck();
  await page.getByLabel('Row density').selectOption('compact');
  await expect(page.locator('.application-list')).toHaveAttribute('data-density', 'compact');
  await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-collapsed/);
});

test('desktop light and dark layouts', async ({ page }) => {
  await page.goto('/workspace');
  await page.screenshot({ path: 'test-results/desktop-light.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.screenshot({ path: 'test-results/desktop-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Open Stanford University', exact: true }).click();
  await page.screenshot({ path: 'test-results/details-dark.png', fullPage: true });
});

test('mobile fits screen and detail dialog supports keyboard close', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/workspace');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-light.png', fullPage: true });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Deadlines', exact: true }).click();
  await expect(page.locator('.deadline-row')).toHaveCount(6);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Applications', exact: true }).click();
  await page.getByRole('button', { name: 'Open Stanford University', exact: true }).click();
  await page.screenshot({ path: 'test-results/details-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.screenshot({ path: 'test-results/mobile-dark.png', fullPage: true });
});
