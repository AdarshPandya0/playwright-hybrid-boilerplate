import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// Import your POMs and APIs here

export const test = base.extend({
  page: async ({ browser }, use, testInfo) => {
    // Choose account index using shard information or worker index.
    let accountIndex = testInfo.config.shard ? testInfo.config.shard.current : (testInfo.parallelIndex % 4) + 1;

    // Credentials are loaded from environment variables such as APP_USERNAME_1.
    const dynamicUsername = process.env[`APP_USERNAME_${accountIndex}`];
    const dynamicPassword = process.env[`APP_PASSWORD_${accountIndex}`];

    const statePath = path.resolve(`.auth/state-${accountIndex}.json`);
    const sessionPath = path.resolve(`.auth/session-${accountIndex}.json`);
    const MAX_CACHE_AGE_HOURS = 3;

    let context;

    // The .auth folder holds per-worker auth caches:
    // - state-{n}.json : Playwright storage state for cookies/localStorage
    // - session-{n}.json : serialized sessionStorage data used by the app
    // This enables a fast path login for repeated test runs.
    // Cleanup stale auth artifacts if they are older than the configured cache age.
    if (fs.existsSync(statePath) && fs.existsSync(sessionPath)) {
      const stats = fs.statSync(statePath);
      const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

      if (ageInHours > MAX_CACHE_AGE_HOURS) {
        console.log(`Cache older than ${MAX_CACHE_AGE_HOURS}h. Deleting...`);
        fs.unlinkSync(statePath);
        fs.unlinkSync(sessionPath);
      }
    }

    // Attempt the fast path using cached storage state and session data.
    if (fs.existsSync(statePath) && fs.existsSync(sessionPath)) {
      context = await browser.newContext({ storageState: statePath });

      // Intercept logout endpoints to avoid session invalidation during setup.
      await context.route('**/*logout*', route => route.fulfill({ status: 200, body: '{"success":true}' }));

      const page = await context.newPage();
      await page.goto('/');

      const sessionData = fs.readFileSync(sessionPath, 'utf-8');
      await page.evaluate((data) => {
        const parsed = JSON.parse(data);
        Object.keys(parsed).forEach(key => window.sessionStorage.setItem(key, parsed[key]));
      }, sessionData);

      await page.goto('/dashboard');

      try {
        await expect(page.locator('text="Dashboard"')).toBeVisible({ timeout: 5000 });
        await use(page);
        await context.close();
        return;
      } catch (error) {
        console.log('Fast path token likely expired or session invalid. Falling back to slow login path...');
        fs.unlinkSync(statePath);
        fs.unlinkSync(sessionPath);
        await context.close();
      }
    }

    // Slow path: perform a UI login and then persist auth state for future runs.
    context = await browser.newContext();
    await context.route('**/*logout*', route => route.fulfill({ status: 200, body: '{"success":true}' }));

    const setupPage = await context.newPage();
    await setupPage.goto('/login');
    await setupPage.locator('input[name="username"]').fill(dynamicUsername);
    await setupPage.locator('input[name="password"]').fill(dynamicPassword);
    await setupPage.locator('button[type="submit"]').click();

    await expect(setupPage.locator('text="Dashboard"')).toBeVisible();

    await context.storageState({ path: statePath });
    const sessionStorageData = await setupPage.evaluate(() => {
      const data = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        data[window.sessionStorage.key(i)] = window.sessionStorage.getItem(window.sessionStorage.key(i));
      }
      return JSON.stringify(data);
    });
    fs.writeFileSync(sessionPath, sessionStorageData);

    await use(setupPage);
    await context.close();
  },

  // Generic API fixture to reuse cookies or tokens from the browser context.
  apiContext: async ({ page, request }, use) => {
    const cookies = await page.context().cookies();
    const token = cookies.find(c => c.name === 'x-token')?.value || '';
    // Initialize Base API Client with token here if needed.
    await use(request);
  }
});

export { expect } from '@playwright/test';
