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
  readonly applyFiltersButton: Locator;
  readonly textboxField: Locator;
  readonly searchBox: Locator;
  readonly checkbox: Locator;
  readonly approveButton: Locator;

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
      name: 'Clear filters',
    });
    this.applyFiltersButton = this.page.getByLabel('Apply');
    this.textboxField = this.page.getByRole('textbox');
    this.searchBox = this.page.getByRole('searchbox');
    this.checkbox = this.page.getByRole('checkbox');
    this.approveButton = this.page.getByRole('button', { name: 'Approve' });
  }

  async getCell(row: number, column: number) {
    return this.tableRows.nth(row).locator('td').nth(column);
  }

  async selectAllCheckbox() {
    await this.selectAllRegistrationsCheckbox.click();
  }

  async waitForLoaded(rowsCount?: number) {
    await expect(this.tableLoading).toHaveCount(0);
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

  async validateTableRowCount({
    expectedRowCount,
  }: {
    expectedRowCount: number;
  }) {
    const regColumnContents = await this.getTextArrayFromColumn(3);
    const regColumnContentsCount = regColumnContents.length;
    expect(regColumnContentsCount).toEqual(expectedRowCount);
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
    await this.clearAllFiltersButton.first().click();
    // wait for 500s for filter to be cleared in the BE
    await this.page.waitForTimeout(500);
  }

  async getSortingTypeOfColumn({ columnName }: { columnName: string }) {
    const sortingType = await this.page
      .getByRole('columnheader', { name: columnName })
      .getAttribute('aria-sort');

    return sortingType;
  }

  async sortAndValidateColumnByName({ columnName }: { columnName: string }) {
    const columnToSort = this.page
      .getByRole('columnheader', { name: columnName })
      .locator('p-sorticon');

    await columnToSort.click();
    let sortingType = await this.getSortingTypeOfColumn({ columnName });
    expect(sortingType).toContain('ascending');

    await columnToSort.click();
    sortingType = await this.getSortingTypeOfColumn({ columnName });
    expect(sortingType).toContain('descending');
  }

  async sortColumnByName({
    columnName,
    sort,
  }: {
    columnName: string;
    sort: 'ascending' | 'descending';
  }) {
    const columnToSort = this.page
      .getByRole('columnheader', { name: columnName })
      .locator('p-sorticon');

    let sortingType = await this.getSortingTypeOfColumn({ columnName });

    if (sortingType === 'none') {
      // Click once to go to ascending
      await columnToSort.click();
      sortingType = await this.getSortingTypeOfColumn({ columnName });

      if (sort === 'ascending') {
        expect(sortingType).toContain('ascending');
        return;
      }
    }

    // If the current state is not the desired state, click to change it
    if (sortingType !== sort) {
      await columnToSort.click();
      sortingType = await this.getSortingTypeOfColumn({ columnName });

      // If still not in the desired state, click again
      if (sortingType !== sort) {
        await columnToSort.click();
        sortingType = await this.getSortingTypeOfColumn({ columnName });
      }
    }

    expect(sortingType).toContain(sort);
  }

  async filterColumnByText({
    columnName,
    filterText,
  }: {
    columnName: string;
    filterText: string;
  }) {
    const filterMenuButton = this.page
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();

    await this.textboxField.click();
    await this.textboxField.fill(filterText);
    await this.applyFiltersButton.click();
  }

  async filterColumnByDropDownSelection({
    columnName,
    selection,
  }: {
    columnName: string;
    selection: string;
  }) {
    const filterMenuButton = this.page
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();

    await this.page.getByText('Choose option(s)').click();
    await this.searchBox.click();
    await this.searchBox.fill(selection);
    await this.page.getByRole('option', { name: selection }).click();
  }

  async validateSortingOfColumns(
    columnName: string,
    columnIndex: number,
    ascendingExpected: string[],
    descendingExpected: string[],
  ) {
    await this.sortColumnByName({ columnName, sort: 'ascending' });
    let textFromColumn = await this.getTextArrayFromColumn(columnIndex);
    expect(textFromColumn).toEqual(ascendingExpected);

    await this.sortColumnByName({ columnName, sort: 'descending' });
    textFromColumn = await this.getTextArrayFromColumn(columnIndex);
    expect(textFromColumn).toEqual(descendingExpected);
  }

  async validateSelectionCount(expectedCount: number) {
    if (expectedCount === 0) {
      await expect(this.page.getByText('selected')).not.toBeVisible();
      return;
    }

    await expect(
      this.page.getByText(`(${expectedCount} selected)`),
    ).toBeVisible();
  }

  async changeStatusOfRegistrationInTable({ status }: { status: string }) {
    const firstCheckbox = this.checkbox.nth(1);
    const statusButton = this.page.getByRole('button', { name: status });
    const placeholder = this.page.getByPlaceholder('Enter reason');

    await firstCheckbox.click();
    await statusButton.click();
    // Condition for when reason is required
    if (await placeholder.isVisible()) {
      await placeholder.fill('Test reason');
    }
    await this.approveButton.click();
  }
}

export default TableComponent;
