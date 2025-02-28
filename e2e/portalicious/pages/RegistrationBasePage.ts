import { Locator, Page } from 'playwright';
import { expect } from 'playwright/test';

import BasePage from './BasePage';

abstract class RegistrationBasePage extends BasePage {
  readonly duplicateChip: Locator;
  readonly duplicatesBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.duplicateChip = this.page.getByTestId('duplicate-chip');
    this.duplicatesBanner = this.page.getByTestId('duplicates-banner');
  }

  async goToRegistrationPage(
    page: 'Activity log' | 'Personal information' | 'Debit cards',
  ) {
    await this.page.getByRole('tab', { name: page }).click();
  }

  async assertDuplicateWith({ duplicateName }: { duplicateName: string }) {
    await this.assertDuplicateStatus({ status: 'Duplicate' });

    await expect(this.duplicatesBanner).toBeVisible();
    await expect(this.duplicatesBanner).toContainText('Duplicated with:');
    await expect(this.duplicatesBanner).toContainText(duplicateName);
  }

  async assertDuplicateStatus({ status }: { status: string }) {
    await expect(this.duplicateChip).toBeVisible();
    await expect(this.duplicateChip).toContainText(status);
  }

  async clickActionDropdown() {
    await this.page.getByRole('button', { name: 'Actions' }).click();
  }

  async inititateAction(action: string) {
    await this.clickActionDropdown();
    await this.page.getByRole('menuitem', { name: action }).click();
  }
}

export default RegistrationBasePage;
