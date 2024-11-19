import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

class TableComponent {
  readonly page: Page;
  readonly tableEmpty: Locator;
  readonly tableLoading: Locator;
  readonly tableRows: Locator;
  readonly selectAllRegistrationsCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tableEmpty = this.page.getByTestId('query-table-empty');
    this.tableLoading = this.page.getByTestId('query-table-loading');
    this.tableRows = this.page.locator('table tbody tr');
    this.selectAllRegistrationsCheckbox = this.page.getByRole('cell', {
      name: 'All items unselected',
    });
  }

  async getCell(row: number, column: number) {
    return this.tableRows.nth(row).locator('td').nth(column);
  }

  async selectAllCheckbox() {
    await this.selectAllRegistrationsCheckbox.click();
  }

  async waitForLoaded(rowsCount?: number) {
    await expect(this.tableLoading).not.toBeVisible();
    await expect(this.tableEmpty).not.toBeVisible();

    if (rowsCount) {
      await expect(this.tableRows).toHaveCount(rowsCount);
    }
  }

  async getTextArrayFromColumn(column: number) {
    return await this.tableRows.evaluateAll(
      (rows, col) =>
        rows.map((row) =>
          row.querySelector(`td:nth-child(${col})`).textContent.trim(),
        ),
      column,
    );
  }
}

export default TableComponent;
