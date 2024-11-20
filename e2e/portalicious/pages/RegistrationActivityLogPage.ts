import { expect } from '@playwright/test';
import { Page } from 'playwright';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';

class RegistrationActivityLogPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
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
}

export default RegistrationActivityLogPage;
