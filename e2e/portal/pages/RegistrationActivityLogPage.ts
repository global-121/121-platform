import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';

import RegistrationBasePage from './RegistrationBasePage';

class RegistrationActivityLogPage extends RegistrationBasePage {
  readonly table: TableComponent;
  readonly personalInformationTab: Locator;
  readonly editInformationButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new TableComponent(page);
    this.personalInformationTab = this.page.getByRole('tab', {
      name: 'Personal Information',
    });
    this.editInformationButton = this.page.getByRole('button', {
      name: 'Edit information',
    });
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
  }

  async validateLastMessageSent(message: string) {
    const dropdownButton = await this.table.getCell(0, 0);
    const lastMessage = (await this.table.getCell(0, 1)).getByText('Message');
    const lastMessageText = await lastMessage.innerText();

    if (lastMessageText === 'Message') {
      await dropdownButton.click();
    }

    const sentMessageText = await this.page.getByText(message).innerText();
    expect(sentMessageText).toBe(message);
    await dropdownButton.click();
  }

  async navigateToPersonalInformation() {
    await this.personalInformationTab.click();
  }
}

export default RegistrationActivityLogPage;
