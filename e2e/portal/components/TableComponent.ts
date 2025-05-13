import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

class TableComponent {
  readonly page: Page;
  readonly table: Locator;
  readonly tableEmpty: Locator;
  readonly tableLoading: Locator;
  readonly tableRows: Locator;
  readonly tableHeader: Locator;
  readonly selectAllRegistrationsCheckbox: Locator;
  readonly globalSearchOpenerButton: Locator;
  readonly globalSearchInput: Locator;
  readonly clearAllFiltersButton: Locator;
  readonly applyFiltersButton: Locator;
  readonly textboxField: Locator;
  readonly searchBox: Locator;
  readonly checkbox: Locator;
  readonly approveButton: Locator;
  readonly calendar: Locator;
  readonly datePicker: Locator;
  readonly rangeDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    // We assume there's only one of these at a time.
    this.table = this.page.getByTestId('query-table');
    this.tableEmpty = this.table.getByTestId('query-table-empty');
    this.tableLoading = this.table.getByTestId('query-table-loading');
    this.tableRows = this.table.locator('tbody tr');
    this.tableHeader = this.table.locator('thead tr');
    this.selectAllRegistrationsCheckbox = this.table.getByRole('cell', {
      name: 'All items unselected',
    });
    this.globalSearchOpenerButton = this.table.getByTitle('Filter by keyword');
    this.globalSearchInput = this.table.getByPlaceholder('Filter by keyword');
    this.clearAllFiltersButton = this.table.getByRole('button', {
      name: 'Clear filters',
    });

    // Not in the HTML of the table component.
    this.applyFiltersButton = this.page.getByLabel('Apply');
    this.textboxField = this.page.getByRole('textbox');
    this.searchBox = this.page.getByRole('searchbox');
    this.checkbox = this.page.getByRole('checkbox');
    this.approveButton = this.page.getByRole('button', { name: 'Approve' });
    this.calendar = this.page.getByLabel('Choose Date');
    this.datePicker = this.page.getByLabel('Choose Date').locator('tbody');
    this.rangeDropdown = this.page
      .getByRole('dialog')
      .getByRole('combobox')
      .first();
  }

  async getCell(row: number, column: number) {
    return this.tableRows.nth(row).locator('td').nth(column);
  }

  async selectAllCheckbox() {
    await this.selectAllRegistrationsCheckbox.click();
  }

  async expandAllRows() {
    await this.table.getByTestId('expand-all-rows-button').click();
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

  async validateTableRowCount(expectedRowCount: number) {
    const rowCount = await this.tableRows.count();
    expect(rowCount).toEqual(expectedRowCount);
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
    // When table is empty we have more than one clear filters button that is why we use first()
    await this.clearAllFiltersButton.first().click();
    // wait for 500s for filter to be cleared in the BE
    await this.page.waitForTimeout(500);
  }

  async getSortingTypeOfColumn(columnName: string) {
    const sortingType = await this.table
      .getByRole('columnheader', { name: columnName })
      .getAttribute('aria-sort');

    return sortingType;
  }

  async sortAndValidateColumnByName(columnName: string) {
    const columnToSort = this.table
      .getByRole('columnheader', { name: columnName })
      .locator('p-sorticon');

    await columnToSort.click();
    let sortingType = await this.getSortingTypeOfColumn(columnName);
    expect(sortingType).toContain('ascending');

    await columnToSort.click();
    sortingType = await this.getSortingTypeOfColumn(columnName);
    expect(sortingType).toContain('descending');
  }

  async sortColumnByName(columnName: string, sort: 'ascending' | 'descending') {
    const columnToSort = this.table
      .getByRole('columnheader', { name: columnName })
      .locator('p-sorticon');

    let sortingType = await this.getSortingTypeOfColumn(columnName);

    if (sortingType === 'none') {
      // Click once to go to ascending
      await columnToSort.click();
      sortingType = await this.getSortingTypeOfColumn(columnName);

      if (sort === 'ascending') {
        expect(sortingType).toContain('ascending');
        return;
      }
    }

    // If the current state is not the desired state, click to change it
    if (sortingType !== sort) {
      await columnToSort.click();
      sortingType = await this.getSortingTypeOfColumn(columnName);

      // If still not in the desired state, click again
      if (sortingType !== sort) {
        await columnToSort.click();
        sortingType = await this.getSortingTypeOfColumn(columnName);
      }
    }

    expect(sortingType).toContain(sort);
  }

  async filterColumnByText(columnName: string, filterText: string) {
    const filterMenuButton = this.table
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();

    await this.textboxField.click();
    await this.textboxField.fill(filterText);
    await this.applyFiltersButton.click();
  }

  async filterColumnByNumber({
    columnName,
    filterNumber,
    filterWithRange = false,
    range,
  }: {
    columnName: string;
    filterNumber: number;
    filterWithRange?: boolean;
    range?: string;
  }) {
    const filterMenuButton = this.table
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();
    if (filterWithRange) {
      await this.rangeDropdown.click();
      await this.page.getByRole('option', { name: range }).click();
    }
    await this.page.getByRole('spinbutton').fill(String(filterNumber));
    await this.applyFiltersButton.click();
  }

  async filterColumnByDropDownSelection({
    columnName,
    selection,
  }: {
    columnName: string;
    selection: string;
  }) {
    const filterMenuButton = this.table
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();

    await this.page.getByText('Choose option(s)').click();
    await this.searchBox.click();
    await this.searchBox.fill(selection);
    await this.page.getByRole('option', { name: selection }).click();
  }

  async filterColumnByDate({
    columnName,
    day,
    filterMode,
  }: {
    columnName: string;
    day: number;
    filterMode: string;
  }) {
    const filterMenuButton = this.table
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();

    await this.rangeDropdown.click();
    await this.page
      .getByRole('option', { name: filterMode, exact: true })
      .click();

    await this.page.locator('input[type="text"]').click();
    await this.datePicker.getByText(`${day}`, { exact: true }).first().click();

    await this.applyFiltersButton.click();
  }

  async validateSortingOfColumns(
    columnName: string,
    columnIndex: number,
    ascendingExpected: string[],
    descendingExpected: string[],
  ) {
    await this.sortColumnByName(columnName, 'ascending');
    let textFromColumn = await this.getTextArrayFromColumn(columnIndex);
    expect(textFromColumn).toEqual(ascendingExpected);

    await this.sortColumnByName(columnName, 'descending');
    textFromColumn = await this.getTextArrayFromColumn(columnIndex);
    expect(textFromColumn).toEqual(descendingExpected);
  }

  async validateFirstLogActivity(activity: string) {
    const firstRowText = await this.getTextArrayFromColumn(2);
    expect(firstRowText[0]).toContain(activity);
  }

  async validateSelectionCount(expectedCount: number) {
    if (expectedCount === 0) {
      await expect(this.table.getByText('selected')).not.toBeVisible();
      return;
    }

    await expect(
      this.table.getByText(`(${expectedCount} selected)`),
    ).toBeVisible();
  }

  async changeStatusOfRegistrationInTable(status: string) {
    const firstCheckbox = this.checkbox.nth(1);
    const statusButton = this.page.getByRole('button', { name: status });
    const placeholder = this.page.getByPlaceholder('Enter reason');
    const deleteLabel = this.page.getByLabel(
      'I understand this action can not be undone',
    );

    await firstCheckbox.click();
    await statusButton.click();
    // Condition for when checkbox is required
    if (await deleteLabel.isVisible()) {
      await deleteLabel.click();
    }
    // Condition for when reason is required
    if (await placeholder.isVisible()) {
      await placeholder.fill('Test reason');
    }
    await this.approveButton.click();
  }

  async changeStatusOfAllRegistrationsInTable(status: string) {
    const statusButton = this.table.getByRole('button', { name: status });
    const placeholder = this.table.getByPlaceholder('Enter reason');

    await this.selectAllCheckbox();
    await statusButton.click();
    // Condition for when reason is required
    if (await placeholder.isVisible()) {
      await placeholder.fill('Test reason');
    }
    await this.approveButton.click();
  }

  async validateAllRecordsCount(expectedCount: number) {
    // Wait for the pagination element to contain the expected count
    await expect(async () => {
      const paginationElement = this.table.getByText(
        /Showing \d+ to \d+ of \d+ records/,
      );
      const paginationText = (await paginationElement.textContent()) ?? '';
      const regex = /Showing \d+ to \d+ of (\d+) records/;
      const match = regex.exec(paginationText);
      const actualCount = parseInt(match?.[1] ?? '', 10);

      if (isNaN(actualCount)) {
        throw new Error(
          `Could not extract total count from pagination text: ${paginationText}`,
        );
      }

      expect(actualCount).toBe(expectedCount);
    }).toPass({ timeout: 2000 }); // Custome timeout set to 2 seconds
  }

  async validateLabelInTableByRegistrationName(
    registrationName: string,
    label: string,
  ) {
    const firstRowText = await this.page
      .getByRole('row', { name: registrationName })
      .getByLabel(label)
      .textContent();
    expect(firstRowText).toBe(label);
  }

  async validateErrorMessage(errorMessage: string) {
    const errorElement = this.page
      .locator('app-form-error')
      .filter({ hasText: errorMessage });
    await expect(errorElement).toContainText(errorMessage);
  }

  async assertEmptyTableState() {
    await this.page.waitForTimeout(200);
    await this.page.waitForSelector('table tbody tr td');
    await expect(this.page.getByText('No results found')).toBeVisible();
  }

  async selectRowByName(name: string) {
    await this.page
      .getByRole('row', { name })
      .getByRole('checkbox')
      .first()
      .click();
  }

  async getSelectedRowsCount(): Promise<number> {
    const checkboxes = this.table.locator('tbody tr input[type="checkbox"]');
    const count = await checkboxes.evaluateAll(
      (elements) => elements.filter((el) => el.checked).length,
    );
    return count;
  }

  async clearColumnFilter(columnName: string): Promise<void> {
    const columnHeader = this.table.getByRole('columnheader', {
      name: columnName,
    });

    const clearFilterButton = columnHeader.locator('.pi-filter-slash');

    await clearFilterButton.click();
  }
}

export default TableComponent;
