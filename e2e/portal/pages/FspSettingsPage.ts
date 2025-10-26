import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import BasePage from './BasePage';

class FspSettingsPage extends BasePage {
  readonly addFspButton: Locator;
  readonly integrateFspButton: Locator;
  readonly fspCard: Locator;

  constructor(page: Page) {
    super(page);
    this.addFspButton = this.page.getByRole('button', {
      name: 'Add another FSP',
    });
    this.integrateFspButton = this.page.getByRole('button', {
      name: 'Integrate FSP',
    });
    this.fspCard = this.page.locator('app-card-with-link p-card');
  }

  async clickEditFspSection() {
    await this.page.getByRole('link', { name: 'FSP' }).click();
  }

  async validateFspVisibility({
    fspNames,
    visible = true,
  }: {
    fspNames: string[];
    visible?: boolean;
  }) {
    // There is no explicit count for checking if an FSP is available more than once
    // Because playwright does it implicitly when checking visibility of an element
    // (e.g. if there are 2 elements with the same text and we check for visibility,
    // it will fail because it doesn't know which one to check)
    for (const fspName of fspNames) {
      const fspLocator = this.fspCard.filter({ hasText: fspName });
      if (visible) {
        await expect(fspLocator).toBeVisible();
      } else {
        await expect(fspLocator).toBeHidden();
      }
    }
  }

  async clickAddAnotherFspButton() {
    await this.addFspButton.click();
  }

  async addFsp({ fspName }: { fspName: string[] }) {
    for (const name of fspName) {
      // Check if we need to click "Add another FSP" first
      await this.page.waitForTimeout(200); // Small wait to ensure buttoon is loaded
      if (await this.addFspButton.isVisible()) {
        await this.addFspButton.click();
      }
      // Now proceed with selecting and configuring the FSP
      await this.fspCard.filter({ hasText: name }).click();
      const inputs = this.page.locator('input');
      const inputCount = await inputs.count();

      if (name === 'Excel Payment Instructions') {
        // Handle dropdowns for Excel Payment Instructions FSP
        const dropdown = this.page.getByPlaceholder('Select 1');
        const dropdownsCount = await dropdown.count();

        for (let i = 0; i < dropdownsCount; i++) {
          await dropdown.nth(i).click();
          // Select the option with the FSP name
          await this.page
            .getByLabel('Full Name')
            .nth(i + 1)
            .click();
          await dropdown.nth(i).click(); // Close the dropdown
        }
      } else {
        for (let i = 1; i < inputCount; i++) {
          const input = inputs.nth(i);
          await input.fill(name);
        }
      }

      await this.integrateFspButton.click();
    }
  }

  async deleteFsp({ fspName }: { fspName: string[] }) {
    for (const name of fspName) {
      const fspCardActions = this.fspCard
        .filter({ hasText: name })
        .getByLabel('More actions');

      await fspCardActions.click();
      await this.page.getByRole('menuitem', { name: 'Delete' }).click();

      // Confirm deletion
      await this.page.getByText('Remove FSP').click();
      // Validate and confirm toast message
      await this.validateToastMessageAndClose('FSP deleted.');
    }
  }
}

export default FspSettingsPage;
