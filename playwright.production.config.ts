import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/production', workers: 1,
  use: { baseURL: 'http://127.0.0.1:5295', extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.10' } },
  webServer: {
    command: 'bun scripts/test-server.ts --production', url: 'http://127.0.0.1:5295/health', reuseExistingServer: false,
    env: { NODE_ENV: 'production', ADDRESS_HEADER: 'x-forwarded-for', XFF_DEPTH: '1', PORT: '5295', HOST: '127.0.0.1', ORIGIN: 'http://127.0.0.1:5295', BETTER_AUTH_URL: 'http://127.0.0.1:5295', BETTER_AUTH_SECRET: 'production-test-only-secret-with-more-than-32-characters', DATABASE_URL: 'postgresql://test_user:test-only-postgres-password@127.0.0.1:55433/dropthatuni_production_' + Date.now(), BODY_SIZE_LIMIT: '12M', R2_ENDPOINT: '', R2_ACCESS_KEY_ID: '', R2_SECRET_ACCESS_KEY: '', REMINDER_FROM_EMAIL: '', RESEND_API_KEY: '', REMINDER_CRON_SECRET: '', REMINDER_AUTO_RUN: 'false', R2_BUCKET_NAME_DOCUMENTS: '' }
  },
  reporter: 'list'
});
