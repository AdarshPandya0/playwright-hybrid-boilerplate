// tests/sample.spec.js
// Example Playwright test file.
// Add your test cases here using the custom fixture imported from utils/fixtures.js.

import { test, expect } from '../utils/fixtures.js';

// This sample shows how to use the shared test fixture and assertion helpers.
test('sample placeholder test to navigate to dashboard', async ({ page }) => {
  await page.goto('/#/app/dashboard');
  await expect(page.getByRole('link', { name: "Dashboard" })).toBeVisible({ timeout: 5000 }); // Wait for the dashboard link to be visible as a sign that the page has loaded.
});
