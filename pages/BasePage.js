// pages/BasePage.js

// Shared page-level helper methods for the hybrid framework.
// Extend this class with page object methods for reusable UI flows.
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Handles unexpected PrimeNG dialogs that may appear after actions.
   * Use this after any click or transition that can trigger modal prompts.
   *
   * @param {string} contextName - a descriptive label for logs and failures
   */
  async handlePotentialModal(contextName = 'Unknown Action') {
    const modalContainer = this.page.locator('.ui-dialog').first();

    try {
      await modalContainer.waitFor({ state: 'visible', timeout: 1500 });

      const titleText = await modalContainer.locator('.ui-dialog-title').innerText();
      const bodyText = await modalContainer.locator('.ui-dialog-content').innerText();
      const cleanBody = bodyText.replace(/\n/g, ' | ').trim();

      console.log(`\n========================================`);
      console.log(`A Prompt Appeared during [${contextName}]`);
      console.log(`TITLE: ${titleText}`);
      console.log(`MESSAGE: ${cleanBody}`);
      console.log(`========================================\n`);

      const yesBtn = modalContainer.locator('button#YES');
      const noBtn = modalContainer.locator('button#NO');
      const closeXBtn = modalContainer.locator('.ui-dialog-titlebar-close');
      const okBtn = modalContainer.getByRole('button', { name: 'Ok', exact: true });

      if (await yesBtn.isVisible()) {
        console.log(`Action: Clicking 'Yes' to proceed.`);
        await yesBtn.click();
        await modalContainer.waitFor({ state: 'hidden', timeout: 3000 });
        return;
      }

      if (await okBtn.isVisible() || await closeXBtn.isVisible() || cleanBody.toLowerCase().includes('error')) {
        if (await okBtn.isVisible()) {
          await okBtn.click();
        } else if (await closeXBtn.isVisible()) {
          await closeXBtn.click();
        }

        throw new Error(`ERROR PROMPT during [${contextName}]: [${titleText}] ${cleanBody}`);
      }
    } catch (error) {
      if (error.message.includes('ERROR PROMPT')) {
        throw error;
      }
      // No modal appeared; continue normally.
    }
  }
}
