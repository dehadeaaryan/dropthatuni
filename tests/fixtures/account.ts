import { expect, type Page } from '@playwright/test';
import type { WorkspaceData } from '../../src/lib/model';
export async function createAccount(page: Page, data?: WorkspaceData) {
  const origin = 'http://127.0.0.1:5293';
  const response = await page.request.post(origin + '/api/auth/sign-up/email', { headers: { Origin: origin }, data: { name: 'Test User', email: crypto.randomUUID() + '@example.com', password: 'test-safe-password-123' } });
  expect(response.ok()).toBeTruthy();
  if (data) {
    const saved = await page.request.put(origin + '/api/workspace', { headers: { Origin: origin }, data });
    expect(saved.ok()).toBeTruthy();
  }
}
