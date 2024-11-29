import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

class TableComponent {
  readonly page: Page;
  readonly tableEmpty: Locator;
  readonly tableLoading: Locator;
  readonly tableRows: Locator;
  readonly selectAllRegistrationsCheckbox: Locator;
  readonly globalSearchOpenerButton: Locator;
  readonly globalSearchInput: Locator;
  readonly clearAllFiltersButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tableEmpty = this.page.getByTestId('query-table-empty');
    this.tableLoading = this.page.getByTestId('query-table-loading');
    this.tableRows = this.page.locator('table tbody tr');
    this.selectAllRegistrationsCheckbox = this.page.getByRole('cell', {
      name: 'All items unselected',
    });
    this.globalSearchOpenerButton = this.page.getByTitle('Filter by keyword');
    this.globalSearchInput = this.page.getByPlaceholder('Filter by keyword');
    this.clearAllFiltersButton = this.page.getByRole('button', {
      name: 'Clear all filters',
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

  async globalSearch(searchText: string) {
    const isGlobalSearchOpen = await this.globalSearchInput.isVisible();

    if (!isGlobalSearchOpen) {
      await this.globalSearchOpenerButton.click();
    }

    await expect(this.globalSearchInput).toBeVisible();
    await this.globalSearchInput.fill(searchText);
    // wait for 500s for filter to be applied in the BE
    await this.page.waitForTimeout(500);
  }

  async clearAllFilters() {
    await this.clearAllFiltersButton.click();
    // wait for 500s for filter to be cleared in the BE
    await this.page.waitForTimeout(500);
  }
}

export default TableComponent;
