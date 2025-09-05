import { Locator, Page } from 'playwright';
import { expect } from 'playwright/test';

import DataListComponent from '../components/DataListComponent';
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
    const titleElement = this.page.getByTestId('registration-title');
    await titleElement.waitFor();
    return (await titleElement.textContent())?.trim() ?? '';
  }

  async getRegistrationSummaryList(): Promise<Record<string, string>> {
    return new DataListComponent(
      this.page.getByTestId('registration-summary-list'),
    ).getData();
  }

  async getRegistrationCreatedDate(): Promise<string> {
    const dateElement = this.page.locator('span:has-text("Registered:")');
    await dateElement.waitFor();
    const fullText = await dateElement.textContent();

    if (!fullText) {
      throw new Error('Registration date not found');
    }
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

  async initiateAction(action: string) {
    await this.clickActionDropdown();
    await this.page.getByRole('menuitem', { name: action }).click();
  }

  async fillNote(note: string) {
    const noteInput = this.page.locator('textarea');
    await noteInput.fill(note);
    await this.page.getByRole('button', { name: 'Add note' }).click();
    await this.validateToastMessageAndClose('Note successfully added.');
  }
}

export default RegistrationBasePage;
