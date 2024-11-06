import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';
import TableComponent from './TableComponent';

class RegistrationsPage extends BasePage {
  readonly page: Page;
  readonly tableRows: Locator;
  readonly selectAllRegistrationsCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.tableRows = this.page.locator('table tbody tr');
    this.selectAllRegistrationsCheckbox = this.page.getByRole('cell', {
      name: 'All items unselected',
    });
  }

  async selectAllRegistrations() {
    await this.selectAllRegistrationsCheckbox.click();
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

  async validateLastMessageSent(message: string) {
    const table = new TableComponent(this.page);

    const dropdownButton = await table.getCell(0, 0);
    const lastMessage = (await table.getCell(0, 1)).getByText('Message');
    const lastMessageText = await lastMessage.innerText();

    if (lastMessageText === 'Message') {
      await dropdownButton.click();
    }

    const sentMessaggeText = await this.page.getByText(message).innerText();
    expect(sentMessaggeText).toBe(message);
  }
}

export default RegistrationsPage;
