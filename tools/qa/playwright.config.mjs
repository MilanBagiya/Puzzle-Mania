// Playwright setup for `pnpm qa`. The built site (apps/web/dist) is served by serve.mjs.
import { defineConfig } from '@playwright/test';
import { ORIGIN } from './lib/site.mjs';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  workers: process.env.QA_WORKERS ? Number(process.env.QA_WORKERS) : '50%',
  retries: 0,
  timeout: 60_000,
  reporter: [['dot'], ['./summary-reporter.mjs']],
  outputDir: './report/test-results',
  use: { baseURL: ORIGIN, browserName: 'chromium', trace: 'off', screenshot: 'off', video: 'off' },
  webServer: { command: 'node serve.mjs', url: ORIGIN + '/', reuseExistingServer: false, timeout: 30_000, stdout: 'ignore' },
});
