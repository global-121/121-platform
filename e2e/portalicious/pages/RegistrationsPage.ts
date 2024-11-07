import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';
import TableComponent from './TableComponent';

class RegistrationsPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly goToProfileOption: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.goToProfileOption = this.page.getByText('Go to profile');
  }

  async selectBulkAction(action: string) {
    await this.page.getByRole('button', { name: action }).click();
  }

  async selectCustomMessage() {
    await this.page
      .locator('label')
      .filter({ hasText: 'Custom message' })
      .click();
  }

  async typeCustomMessage(message: string) {
    await this.page.fill('textarea', message);
  }

  async selectTemplatedMessage(messageTemplate: string) {
    await this.page.getByLabel('Choose message').click();
    await this.page.getByLabel(messageTemplate, { exact: true }).click();
  }

  async clickContinueToPreview() {
    await this.page
      .getByRole('button', { name: 'Continue to preview' })
      .click();
  }

  async validateMessagePresent(message: string) {
    await this.page.waitForTimeout(200);
    await expect(this.page.locator('textarea')).toBeDisabled();
    const textboxValue = await this.page.$eval(
      'textarea',
      (textarea) => textarea.value,
    );
    expect(textboxValue).toContain(message);
  }

  async sendMessage() {
    await this.page.getByRole('button', { name: 'Send message' }).click();
  }

  async getFirstRegistrationNameFromTable() {
    await this.page.waitForTimeout(200);
    await this.page.waitForSelector('table tbody tr td');
    const fullName = await this.table.getCell(0, 2);
    const fullNameText = (await fullName.textContent())?.trim();
    return fullNameText;
  }

  async goToRegistrationByName({
    registrationName,
  }: {
    registrationName: string;
  }) {
    const rowCount = await this.table.tableRows.count();
    for (let i = 0; i <= rowCount; i++) {
      const fullName = await this.table.getCell(i, 2);
      const fullNameText = (await fullName.textContent())?.trim();
      const isRequestedFullName = fullNameText?.includes(registrationName);

      if (
        (registrationName && isRequestedFullName) ||
        (!registrationName && !isRequestedFullName)
      ) {
        await fullName.click({ button: 'right' });
        await this.goToProfileOption.click();
        return;
      }
    }
    throw new Error('Registration not found');
  }

  async goToRandomRegistration() {
    const rowCount = await this.table.tableRows.count();
    const randomIndex = Math.floor(Math.random() * rowCount);
    const fullName = await this.table.getCell(randomIndex, 2);

    await fullName.click({ button: 'right' });
    await this.goToProfileOption.click();
    return randomIndex;
  }
}

export default RegistrationsPage;
