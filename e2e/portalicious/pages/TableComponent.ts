import { Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from './BasePage';

class TableComponent extends BasePage {
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

  async getCell(row: number, column: number) {
    return this.tableRows.nth(row).locator('td').nth(column);
  }

  async selectAll() {
    await this.selectAllRegistrationsCheckbox.click();
  }
}

export default TableComponent;
