import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env so the config can read CI settings and application URLs.
// Note: this setup allows your tests to rely on `process.env.BASE_URL` rather than hard-coding a base URL.
dotenv.config({
  path: `./.env/.env.${process.env.ENV}`,
});

export default defineConfig({
  // Where Playwright looks for test files.
  testDir: './tests',

  // Allow different test files to run in parallel.
  fullyParallel: true,

  // Fail CI if `test.only` is left in a commit.
  forbidOnly: !!process.env.CI,

  // Retry flaky tests in CI only.
  retries: process.env.CI ? 2 : 0,

  // Use a stable worker count in CI to avoid resource spikes.
  workers: process.env.CI ? 4 : undefined,

  // Generate both HTML and blob reports for diagnostics.
  reporter: [['html'], ['blob']],

  use: {
    baseURL: process.env.URL,

    // Capture trace only on the first retry for failed tests.
    trace: 'on-first-retry',

    // Capture screenshots only when a test fails.
    screenshot: 'only-on-failure',

    // Default timeout for single actions like click/fill.
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
