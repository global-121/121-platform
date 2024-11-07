import { expect } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';
import TableComponent from './TableComponent';

class RegistrationActivityLogPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
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

export default RegistrationActivityLogPage;
