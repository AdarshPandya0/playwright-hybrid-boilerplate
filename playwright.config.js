import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env so the config can read BASE_URL and CI settings.
dotenv.config({ path: '.env' });

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
    // Base URL for app navigation. Override using .env if needed.
    baseURL: process.env.BASE_URL || 'https://your-app-url.com',

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
