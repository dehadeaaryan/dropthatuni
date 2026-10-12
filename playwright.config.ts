import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testIgnore: '**/production/**', fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5293', browserName: 'chromium', colorScheme: 'light', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  webServer: { command: 'bun scripts/test-server.ts', url: 'http://127.0.0.1:5293', reuseExistingServer: false,
    env: { DROPTHATUNI_TEST_MODE: 'true', DATABASE_URL: 'postgresql://test_user:test-only-postgres-password@127.0.0.1:55432/dropthatuni_ui_' + Date.now(), BETTER_AUTH_URL: 'http://127.0.0.1:5293', BETTER_AUTH_SECRET: 'local-ui-test-secret-with-at-least-32-characters', R2_ENDPOINT: 'http://127.0.0.1:5293/__test-r2', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test', R2_BUCKET_NAME_DOCUMENTS: 'test-documents', REMINDER_AUTO_RUN: 'false', RESEND_API_KEY: 'test-only', REMINDER_FROM_EMAIL: 'DropThatUni <reminders@example.com>', REMINDER_CRON_SECRET: 'test-cron-secret', RESEND_API_URL: 'http://127.0.0.1:5293/__test-email' } },
  reporter: 'list'
});
