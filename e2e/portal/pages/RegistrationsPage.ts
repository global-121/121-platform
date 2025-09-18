import { expect, Locator } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';
import { Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';

import { expectedSortedArraysToEqual } from '../utils';

class RegistrationsPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly sendMessageDialogPreview: Locator;
  readonly exportButton: Locator;
  readonly proceedButton: Locator;
  readonly downloadTemplateButton: Locator;
  readonly importButton: Locator;
  readonly importFileButton: Locator;
  readonly exportCSVFieldsDropdown: Locator;
  readonly exportCSVButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.sendMessageDialogPreview = this.page.getByTestId(
      'send-message-dialog-preview',
    );
    this.exportButton = this.page.getByRole('button', { name: 'Export' });
    this.proceedButton = this.page.getByRole('button', { name: 'Proceed' });
    this.downloadTemplateButton = this.page.getByRole('button', {
      name: 'Download the template',
    });
    this.importButton = this.page.getByRole('button', { name: 'Import' });
    this.importFileButton = this.page.getByRole('button', {
      name: 'Import file',
    });
    this.exportCSVFieldsDropdown = this.page.getByPlaceholder(
      'Select 1 or more columns',
    );
    this.exportCSVButton = this.page.getByRole('button', {
      name: 'Export CSV',
    });
  }

  async waitForLoaded(registrationsCount: number) {
    await this.table.waitForLoaded(registrationsCount);
  }

  async selectBulkAction(action: string) {
    await this.page.getByRole('button', { name: action }).click();
  }

  async selectAllRegistrations() {
    await this.table.selectAll();
  }

  async deselectRegistrations() {
    const checkedCheckbox = this.page.getByLabel('Row Selected');
    let selectedRegistrationsCount = await checkedCheckbox.count();

    while (selectedRegistrationsCount > 0) {
      await checkedCheckbox.first().click();
      selectedRegistrationsCount = await checkedCheckbox.count();
    }
  }

  async selectCustomMessage() {
    await this.page
      .locator('label')
      .filter({ hasText: 'Custom message' })
      .click();
  }

  async typeCustomMessage(message: string) {
    await this.page.fill('textarea', message);
  }

  async selectTemplatedMessage(messageTemplate: string) {
    await this.page.getByLabel('Choose message').click();
    await this.page.getByLabel(messageTemplate, { exact: true }).click();
  }

  async clickContinueToPreview() {
    await this.page
      .getByRole('button', { name: 'Continue to preview' })
      .click();
  }

  async validateMessagePresent(message: string) {
    await this.page.waitForTimeout(200);
    await expect(this.page.locator('textarea')).toHaveAttribute('readonly');
    const textboxValue = await this.page.$eval(
      'textarea',
      (textarea) => textarea.value,
    );
    expect(textboxValue).toContain(message);
  }

  async sendMessage() {
    await this.page.getByRole('button', { name: 'Send message' }).click();
    await this.table.validateSelectionCount(0);
  }

  async configureTableColumns({
    columns,
    onlyGivenColumns,
  }: {
    columns: string[];
    onlyGivenColumns?: boolean;
  }) {
    await this.page.getByTitle('Manage table').click();

    if (onlyGivenColumns) {
      // Deselect all columns first
      const dialog = this.page.locator('form');
      const checkboxes = dialog.getByRole('checkbox');
      const checkboxesCount = await checkboxes.count();
      for (let i = 0; i < checkboxesCount; i++) {
        const checkbox = checkboxes.nth(i);
        if (await checkbox.isChecked()) {
          await checkbox.click();
        }
      }
    }

    for (const column of columns) {
      await this.page.getByLabel(column).first().check();
    }

    await this.page.getByRole('button', { name: 'Apply' }).click();

    if (onlyGivenColumns) {
      // Validate only the given columns are visible in the table
      const headerTexts = await this.table.getTextArrayFromHeader();
      headerTexts.shift(); // Remove first column (checkboxes)
      headerTexts.pop(); // Remove last column (actions)
      expect(headerTexts).toEqual(columns);
    }
  }

  async getFirstRegistrationNameFromTable() {
    await this.page.waitForTimeout(200);
    await this.page.waitForSelector('table tbody tr td');
    const fullName = await this.table.getCell(0, 2);
    const fullNameText = (await fullName.textContent())?.trim();
    if (!fullNameText) {
      throw new Error('Could not find full name in the table');
    }
    return fullNameText;
  }

  async getColumnIndexByHeaderText(headerText: string): Promise<number> {
    const tableHeader = this.table.tableHeader.locator('th', {
      hasText: headerText,
    });
    await expect(async () => {
      await expect(tableHeader).toBeVisible();
    }).toPass({ timeout: 5000 });

    const headerTexts = await this.table.getTextArrayFromHeader();
    return headerTexts.findIndex((text) => text.trim() === headerText);
  }

  async validateStatusOfFirstRegistration({ status }: { status: string }) {
    await this.table.waitForLoaded();
    const columnIndex = await this.getColumnIndexByHeaderText(
      'Registration Status',
    );
    const registrationStatus = this.table.tableRows
      .nth(0)
      .locator('td')
      .nth(columnIndex);
    await expect(registrationStatus).toHaveText(status);
  }

  async goToRegistrationByName({
    registrationName,
  }: {
    registrationName: string;
  }) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    const rowCount = await this.table.tableRows.count();
    for (let i = 0; i <= rowCount; i++) {
      const fullName = await this.table.getCell(i, 2);
      const fullNameText = (await fullName.textContent())?.trim();
      const isRequestedFullName = fullNameText?.includes(registrationName);

      if (
        (registrationName && isRequestedFullName) ||
        (!registrationName && !isRequestedFullName)
      ) {
        await fullName.getByRole('link').click();
        return;
      }
    }
    throw new Error('Registration not found');
  }

  async performActionOnRegistrationByName({
    registrationName,
    action,
  }: {
    registrationName: string;
    action: string;
  }) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    const rowCount = await this.table.tableRows.count();
    for (let i = 0; i <= rowCount; i++) {
      const fullName = await this.table.getCell(i, 2);
      const fullNameText = (await fullName.textContent())?.trim();
      const isRequestedFullName = fullNameText?.includes(registrationName);

      if (
        (registrationName && isRequestedFullName) ||
        (!registrationName && !isRequestedFullName)
      ) {
        await this.performActionWithRightClick(action, i);
        return;
      }
    }
    throw new Error('Registration not found');
  }

  async cancelSendMessageBulkAction() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async validateSendMessagePaCount(count: number) {
    const dialogText = await this.sendMessageDialogPreview.innerText();

    // Extract the number from the dialog text
    const regex = /(\d+)/;
    const match = regex.exec(dialogText);
    if (!match) {
      throw new Error('Dialog text does not match expected format');
    }

    const actualCount = parseInt(match[1], 10);
    // Validate the count
    expect(actualCount).toBe(count);
  }

  async goToRandomRegistration() {
    const rowCount = await this.table.tableRows.count();
    const randomIndex = Math.floor(Math.random() * rowCount);
    const fullName = await this.table.getCell(randomIndex, 2);

    await fullName.getByRole('link').click();
    return randomIndex;
  }

  async selectMultipleRegistrations(selectionCount: number) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    for (let i = 1; i <= selectionCount; i++) {
      const rowCheckbox = await this.table.getCell(i, 0);
      await rowCheckbox.click();
    }
    await this.table.validateSelectionCount(selectionCount);
  }

  async performActionWithRightClick(action: string, row = 0) {
    await this.table.tableRows.nth(row).click({ button: 'right' });
    await this.page.getByLabel(action).click();

    if (action !== 'Message' && action !== 'Open in new tab') {
      await this.page.getByRole('button', { name: 'Approve' }).click();
    }
  }

  async clickAndSelectImportOption(option: string) {
    await this.importButton.click();
    await this.page.getByRole('menuitem', { name: option }).click();
  }

  async validateImportOptionNotVisible() {
    await expect(this.importButton).toBeHidden();
  }

  async clickAndSelectExportOption(option: string) {
    await this.exportButton.click();
    await this.page.getByRole('menuitem', { name: option }).click();
  }

  async assertExportButtonIsHidden() {
    await expect(this.exportButton).toBeHidden();
  }

  async clickProceedToExport() {
    await this.proceedButton.click();
  }

  async importRegistrations(filePath: string) {
    await this.clickAndSelectImportOption('Import new registrations');
    await this.chooseAndUploadFile(filePath);
    await this.importFileButton.click();
  }

  async exportMassUpdateCSV({
    expectedRowCount,
    columns,
  }: {
    expectedRowCount: number;
    columns: string[];
  }) {
    await this.exportCSVFieldsDropdown.click();
    for (const column of columns) {
      await this.page.getByRole('option', { name: column }).click();
    }
    const filePath = await this.downloadFile(this.exportCSVButton.click());
    await this.validateToastMessageAndClose('Exporting');
    await this.validateExportedFile({
      filePath,
      expectedRowCount,
      format: 'csv',
    });
    return filePath;
  }

  async massUpdateRegistrations({
    expectedRowCount,
    columns,
    reason,
    transformCSVFunction,
  }: {
    expectedRowCount: number;
    columns: string[];
    reason: string;
    transformCSVFunction: (csv: string) => string;
  }) {
    const downloadedCSVFilePath = await this.exportMassUpdateCSV({
      expectedRowCount,
      columns,
    });

    const csv = readFileSync(downloadedCSVFilePath, 'utf-8');
    const updatedCSV = transformCSVFunction(csv);
    const updatedCSVFilePath = downloadedCSVFilePath.replace(
      '.csv',
      '-updated.csv',
    );

    writeFileSync(updatedCSVFilePath, updatedCSV, 'utf-8');

    await this.chooseAndUploadFile(updatedCSVFilePath);
    await this.page.getByPlaceholder('Enter reason').fill(reason);
    await this.page
      .getByLabel(
        'I understand that all registrations included in this file will be updated, overriding existing registration data, and that this action can not be undone.',
      )
      .check();

    await this.importFileButton.click();
  }

  async assertImportTemplateForPvProgram() {
    await this.clickAndSelectImportOption('Import new registrations');

    const filePath = await this.downloadFile(
      this.downloadTemplateButton.click(),
    );

    await this.validateExportedFile({
      filePath,
      // Verify the template is empty (contains only header row)
      expectedRowCount: 0,
      format: 'csv',
    });
  }

  async assertDuplicateColumnValues(expectedValues: string[]) {
    await expect(async () => {
      const duplicateColumnValues = await this.table.getTextArrayFromColumn(5);
      expectedSortedArraysToEqual(duplicateColumnValues, expectedValues);
    }).toPass({ timeout: 500 });
  }

  async waitForImportProcessToComplete() {
    // First wait for loading state to appear (import starts)
    await expect(this.importFileButton).toHaveClass(/p-button-loading/);

    // Then wait for loading state to disappear (import completes)
    // It is a primeNG component, so we can't use the built-in waitForLoadState method
    await expect(this.importFileButton).not.toHaveClass(/p-button-loading/, {
      timeout: 10000,
    });
  }
}

export default RegistrationsPage;
