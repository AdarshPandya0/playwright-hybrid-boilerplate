import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// Import your POMs and APIs here

export const test = base.extend({
  page: async ({ browser }, use, testInfo) => {
    // Choose account index using shard information or worker index.
    let accountIndex = testInfo.config.shard ? testInfo.config.shard.current : (testInfo.parallelIndex % 4) + 1;

    // Credentials are loaded from environment variables such as EHR_USERNAME_1.
    const dynamicUsername = process.env[`EHR_USERNAME_${accountIndex}`];
    const dynamicPassword = process.env[`EHR_PASSWORD_${accountIndex}`];
    const clinic = process.env.EHR_CLINIC;

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
          console.log('Attempting Fast Path Login...');
          context = await browser.newContext({ storageState: statePath });

          await context.route('**/*logout*', route => {
              route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
          });

          const page = await context.newPage();
          await page.goto('/#/app/dashboard'); 

          const sessionData = fs.readFileSync(sessionPath, 'utf-8');
          await page.evaluate((data) => {
              const parsedSession = JSON.parse(data);
              for (const key of Object.keys(parsedSession)) {
                  window.sessionStorage.setItem(key, parsedSession[key]);
              }
          }, sessionData);

          await page.goto('/#/app/dashboard'); 

          try {
              // Wait for the Dashboard. If it redirects to login, this will fail!
              await expect(page.getByRole('link', { name: "Dashboard" })).toBeVisible({ timeout: 5000 });
              
              // IF WE GET HERE, FAST PATH WAS A SUCCESS!
              await use(page);
              await context.close();
              return; // Exit the fixture completely!
              
          } catch (error) {
              // IF WE GET HERE, THE TOKEN WAS DEAD (401 Redirect)
              console.log('Fast path failed (Token likely expired server-side / Logout Attempt). Falling back to Slow Path...');
              
              // Delete the poisoned files so they aren't used again
              fs.unlinkSync(statePath);
              fs.unlinkSync(sessionPath);
              
              // Close the broken context
              await context.close();
              
              // DO NOT THROW AN ERROR. Let the code continue down to the Slow Path!
          }
      } 

    // Slow path: perform a UI login and then persist auth state for future runs.
    console.log('Executing Slow Path Login...');
        context = await browser.newContext();

        await context.route('**/*logout*', route => {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });

        const setupPage = await context.newPage();

        await setupPage.goto('/#/login');
        await setupPage.locator('#clinic input').fill(clinic);
        await setupPage.locator('#username input').fill(dynamicUsername);
        await setupPage.locator('#password input').fill(dynamicPassword);
        await setupPage.getByRole('button', { name: 'Login' }).click();

        await expect(setupPage.getByRole('link', { name: "Dashboard" })).toBeVisible();

        // Snapshot Cookies and Local Storage
        await context.storageState({ path: statePath });

        // Extract Session Storage
        const sessionStorageData = await setupPage.evaluate(() => {
            const data = {};
            for (let i = 0; i < window.sessionStorage.length; i++) {
                const key = window.sessionStorage.key(i);
                data[key] = window.sessionStorage.getItem(key);
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
