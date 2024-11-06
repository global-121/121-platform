import { Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';

class TableComponent extends BasePage {
  readonly page: Page;
  readonly tableRows: Locator;
  readonly goToProfileOption: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.tableRows = this.page.locator('table tbody tr');
    this.goToProfileOption = this.page.getByText('Go to profile');
  }

  async getCell(row: number, column: number) {
    return this.tableRows.nth(row).locator('td').nth(column);
  }

  async getFirstRegistrationNameFromTable() {
    await this.page.waitForTimeout(200);
    await this.page.waitForSelector('table tbody tr td');
    const fullName = await this.getCell(0, 2);
    const fullNameText = (await fullName.textContent())?.trim();
    return fullNameText;
  }

  async selectRegistrationByName({
    registrationName,
  }: {
    registrationName: string;
  }) {
    const rowCount = await this.tableRows.count();
    for (let i = 0; i <= rowCount; i++) {
      const fullName = await this.getCell(i, 2);
      const fullNameText = (await fullName.textContent())?.trim();
      const isRequestedFullName = fullNameText?.includes(registrationName);

      if (
        (registrationName && isRequestedFullName) ||
        (!registrationName && !isRequestedFullName)
      ) {
        await fullName.click({ button: 'right' });
        await this.goToProfileOption.click();
        return i;
      }
    }
    return -1;
  }

  async selectRandomRegistration() {
    const rowCount = await this.tableRows.count();
    const randomIndex = Math.floor(Math.random() * rowCount);
    const fullName = await this.getCell(randomIndex, 2);

    await fullName.click({ button: 'right' });
    await this.goToProfileOption.click();
    return randomIndex;
  }
}

export default TableComponent;
