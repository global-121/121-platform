import { expect, Locator } from '@playwright/test';
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
  }

  async waitForLoaded(registrationsCount: number) {
    await this.table.waitForLoaded(registrationsCount);
  }

  async selectBulkAction(action: string) {
    await this.page.getByRole('button', { name: action }).click();
  }

  async selectAllRegistrations() {
    await this.table.selectAllCheckbox();
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

  async manageTableColumns(columns: string[]) {
    await this.page.getByTitle('Manage table').click();
    for (const column of columns) {
      await this.page.getByLabel(column).check();
    }
    await this.page.getByRole('button', { name: 'Apply' }).click();
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

  async validateStatusOfFirstRegistration({ status }: { status: string }) {
    await this.table.waitForLoaded();
    const registrationStatus = await this.table.getCell(0, 3);
    const statusText = (await registrationStatus.textContent())?.trim();
    if (!statusText) {
      throw new Error('Could not find status in the table');
    }
    expect(statusText).toBe(status);
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

  async exportAndAssertData({
    minRowCount,
    exactRowCount,
    excludedColumns,
    orderOfDataIsImportant,
  }: {
    minRowCount?: number;
    exactRowCount?: number;
    excludedColumns?: string[];
    orderOfDataIsImportant?: boolean;
  } = {}) {
    const filePath = await this.downloadFile(this.clickProceedToExport());
    await this.validateExportedFile({
      filePath,
      minRowCount,
      expectedRowCount: exactRowCount,
      format: 'xlsx',
      excludedColumns,
      orderOfDataIsImportant,
    });
  }

  async assertImportTemplateForPvProgram() {
    await this.importButton.click();

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
    const duplicateColumnValues = await this.table.getTextArrayFromColumn(5);
    expectedSortedArraysToEqual(duplicateColumnValues, expectedValues);
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
