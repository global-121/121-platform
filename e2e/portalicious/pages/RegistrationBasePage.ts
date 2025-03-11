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

  async getRegistrationTitle(): Promise<string> {
    const titleElement = this.page.locator('p-card h1').first();
    await titleElement.waitFor({ state: 'visible', timeout: 5000 });
    return (await titleElement.textContent())?.trim() || '';
  }

  getRegistrationSummaryList() {
    return this.page.getByTestId('registration-summary-list');
  }

  async getDataListItemValue(label: string): Promise<string> {
    const dataList = this.getRegistrationSummaryList();

    const row = dataList.locator(`p:has(strong:text-is("${label}:"))`).first();
    await row.waitFor({ state: 'visible', timeout: 5000 });
    const fullText = (await row.textContent()) || '';

    const labelText = `${label}:`;
    return fullText
      .substring(fullText.indexOf(labelText) + labelText.length)
      .trim();
  }

  async hasDataListItem(label: string): Promise<boolean> {
    const dataList = this.getRegistrationSummaryList();
    const row = dataList.locator(`p:has(strong:text-is("${label}:"))`);
    return (await row.count()) > 0;
  }

  async getRegistrationCreatedDate(): Promise<string> {
    const dateElement = this.page.locator('span:has-text("Registered:")');
    await dateElement.waitFor({ state: 'visible', timeout: 5000 });
    const fullText = (await dateElement.textContent()) || '';

    return fullText.replace('Registered:', '').trim();
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
