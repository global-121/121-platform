import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

class TableComponent {
  readonly page: Page;
  readonly table: Locator;
  readonly tableEmpty: Locator;
  readonly tableLoading: Locator;
  readonly tableRows: Locator;
  readonly tableHeader: Locator;
  readonly selectAllRowsCheckbox: Locator;
  readonly globalSearchOpenerButton: Locator;
  readonly globalSearchInput: Locator;
  readonly clearAllFiltersButton: Locator;
  readonly applyFiltersButton: Locator;
  readonly textboxField: Locator;
  readonly searchBox: Locator;
  readonly checkbox: Locator;
  readonly approveButton: Locator;
  readonly continueToPreviewButton: Locator;
  readonly sendMessageSwitch: Locator;
  readonly calendar: Locator;
  readonly datePicker: Locator;
  readonly filterModeDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    // We assume there's only one of these at a time.
    this.table = this.page.getByTestId('query-table');
    this.tableEmpty = this.table.getByTestId('query-table-empty');
    this.tableLoading = this.table.getByTestId('query-table-loading');
    this.tableRows = this.table.locator('tbody tr');
    this.tableHeader = this.table.locator('thead tr');
    this.selectAllRowsCheckbox = this.table
      .getByRole('cell', {
        name: 'All items unselected',
      })
      .getByRole('checkbox');
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
    this.continueToPreviewButton = this.page.getByRole('button', {
      name: 'Continue to preview',
    });
    this.sendMessageSwitch = this.page.getByLabel('Send a message to');
    this.calendar = this.page.getByLabel('Choose Date');
    this.datePicker = this.page.getByLabel('Choose Date').locator('tbody');
    this.filterModeDropdown = this.page
      .getByRole('dialog')
      .getByRole('combobox')
      .first();
  }

  async getCell(row: number, column: number) {
    return this.tableRows.nth(row).locator('td').nth(column);
  }

  async selectAll() {
    await expect(this.selectAllRowsCheckbox).not.toBeChecked();
    await this.selectAllRowsCheckbox.click();
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
    await expect(this.tableRows).toHaveCount(expectedRowCount);
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
    const header = this.table.getByRole('columnheader', { name: columnName });
    await header.waitFor({ state: 'attached' });
    return await header.getAttribute('aria-sort');
  }

  async waitForSortingColumnToBeSorted({
    columnName,
    type,
  }: {
    columnName: string;
    type?: 'ascending' | 'descending';
  }) {
    const header = this.table.getByRole('columnheader', { name: columnName });
    await header.waitFor({ state: 'attached' });

    if (type === 'ascending' || type === 'descending') {
      await expect(header).toHaveAttribute('aria-sort', type, {
        timeout: 2000,
      });
    } else {
      await expect(header).toHaveAttribute(
        'aria-sort',
        /ascending|descending/,
        { timeout: 2000 },
      );
    }
  }

  async sortAndValidateColumnByName(columnName: string) {
    const columnToSort = this.table
      .getByRole('columnheader', { name: columnName })
      .locator('p-sorticon');

    await columnToSort.click();
    await this.waitForSortingColumnToBeSorted({
      columnName,
      type: 'ascending',
    });

    await columnToSort.click();
    await this.waitForSortingColumnToBeSorted({
      columnName,
      type: 'descending',
    });
  }

  async sortColumnByName(columnName: string, sort: 'ascending' | 'descending') {
    // Find out what the current state is
    const sortingType = await this.getSortingTypeOfColumn(columnName);
    const columnToSort = this.table
      .getByRole('columnheader', { name: columnName })
      .locator('p-sorticon');

    // If the current state is not the desired state, click to change it
    if (sortingType !== sort) {
      await columnToSort.click();
      await this.waitForSortingColumnToBeSorted({
        columnName,
      });
      const sortingType = await this.getSortingTypeOfColumn(columnName);

      // If still not in the desired state, click again
      if (sortingType !== sort) {
        await columnToSort.click();
        await this.waitForSortingColumnToBeSorted({
          columnName,
        });
      }
    }
  }

  async filterColumnByText({
    columnName,
    filterText,
    filterMode,
  }: {
    columnName: string;
    filterText: string;
    filterMode?: 'Equal to' | 'Not equal to' | 'Contains';
  }) {
    const filterMenuButton = this.table
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();

    if (filterMode) {
      await this.filterModeDropdown.click();
      await this.page
        .getByRole('option', { name: filterMode, exact: true })
        .click();
    }

    await this.textboxField.click();
    await this.textboxField.fill(filterText);
    await this.applyFiltersButton.click();
    await this.waitForLoaded();
  }

  async filterColumnByNumber({
    columnName,
    filterNumber,
    filterMode,
  }: {
    columnName: string;
    filterNumber: number;
    filterMode?: 'Less than' | 'Greater than' | 'Not equal to' | 'Equal to';
  }) {
    const filterMenuButton = this.table
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();
    if (filterMode) {
      await this.filterModeDropdown.click();
      await this.page.getByRole('option', { name: filterMode }).click();
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
    day: string;
    filterMode: string;
  }) {
    const filterMenuButton = this.table
      .getByRole('columnheader', { name: columnName })
      .getByLabel('Show Filter Menu');

    await filterMenuButton.scrollIntoViewIfNeeded();
    await filterMenuButton.click();

    await this.filterModeDropdown.click();
    await this.page
      .getByRole('option', { name: filterMode, exact: true })
      .click();

    await this.page.locator('input[type="text"]').click();
    await this.page.locator(`[data-date="${day}"]`).click();

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
    // Wait until the first cell in column 2 contains the expected activity
    const firstCell = this.tableRows.nth(0).locator('td').nth(1); // column index is zero-based
    await expect(firstCell).toContainText(activity);
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

  async fillCustomMessage(message: string) {
    await this.sendMessageSwitch.check();
    await this.page.locator('textarea').fill(message);
  }

  async selectRowByTextContent(name: string) {
    const registrationName = this.page.locator('tr').filter({ hasText: name });
    const checkbox = registrationName.locator('input[type="checkbox"]');

    await checkbox.click();
  }

  async changeRegistrationStatusByNameWithOptions({
    registrationName,
    status,
    sendMessage,
    sendCustomMessage = false,
    sendTemplatedMessage = false,
    customMessage,
  }: {
    registrationName: string;
    status: string;
    sendMessage: boolean;
    sendCustomMessage?: boolean;
    sendTemplatedMessage?: boolean;
    customMessage?: string;
  }) {
    const statusButton = this.page.getByRole('button', { name: status });
    const reasonField = this.page.getByPlaceholder('Enter reason');
    const deleteLabel = this.page.getByLabel(
      'I understand this action can not be undone',
    );

    await this.selectRowByTextContent(registrationName);
    await statusButton.click();

    // Check for delete confirmation
    if (await deleteLabel.isVisible()) {
      await deleteLabel.click();
    }

    if (sendMessage === true) {
      if (sendTemplatedMessage === true) {
        await this.sendMessageSwitch.check();
        await this.approveButton.click();
      } else if (sendCustomMessage === true) {
        // Only fill reason field if it's visible
        if (await reasonField.isVisible()) {
          await reasonField.fill('Test reason');
        }
        await this.fillCustomMessage(customMessage ?? '');
        await this.continueToPreviewButton.click();
        await this.approveButton.click();
      }
    } else {
      if (await reasonField.isVisible()) {
        await reasonField.fill('Test reason');
      }
      await this.approveButton.click();
    }
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

  async validateMessageActivityByTypeAndText({
    notificationType,
  }: {
    notificationType: string;
  }) {
    const messageNotification = this.page
      .locator('tr')
      .filter({ hasText: notificationType });
    const notificationText = this.page.locator('app-activity-log-expanded-row');

    await messageNotification.getByRole('button').click();
    const messageText = await notificationText.textContent();
    // Check message content with snapshot
    expect(messageText).toMatchSnapshot();
  }

  async validateActivityNotPresentByType(notificationType: string) {
    const messageNotification = this.page
      .locator('tr')
      .filter({ hasText: notificationType });

    await expect(messageNotification).not.toBeVisible();
  }

  async validateActivityPresentByType({
    notificationType,
    count,
  }: {
    notificationType: string;
    count: number;
  }) {
    const messageNotification = this.page
      .locator('tr')
      .filter({ hasText: notificationType });

    await expect(messageNotification).toBeVisible();
    await expect(messageNotification).toHaveCount(count);
  }
}

export default TableComponent;
