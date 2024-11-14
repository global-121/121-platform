import { expect, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Page } from 'playwright';
import * as XLSX from 'xlsx';

import BasePage from './BasePage';
import TableComponent from './TableComponent';

const expectedColumnsDebitCard = [
  'paId',
  'referenceId',
  'registrationStatus',
  'cardNumber',
  'cardStatus121',
  'issuedDate',
  'balance',
  'explanation',
  'spentThisMonth',
  'isCurrentWallet',
];

interface ExportDebitCardAssertionData {
  registrationStatus: string;
  paId: number;
  balance: number;
  spentThisMonth: number;
  isCurrentWallet: boolean;
}

class RegistrationsPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly goToProfileOption: Locator;
  readonly sendMessageDialogPreview: Locator;
  readonly exportButton: Locator;
  readonly proceedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.goToProfileOption = this.page.getByText('Go to profile');
    this.sendMessageDialogPreview = this.page.getByTestId(
      'send-message-dialog-preview',
    );
    this.exportButton = this.page.getByRole('button', { name: 'Export' });
    this.proceedButton = this.page.getByRole('button', { name: 'Proceed' });
  }

  async selectBulkAction(action: string) {
    await this.page.getByRole('button', { name: action }).click();
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
    await expect(this.page.locator('textarea')).toBeDisabled();
    const textboxValue = await this.page.$eval(
      'textarea',
      (textarea) => textarea.value,
    );
    expect(textboxValue).toContain(message);
  }

  async sendMessage() {
    await this.page.getByRole('button', { name: 'Send message' }).click();
  }

  async getFirstRegistrationNameFromTable() {
    await this.page.waitForTimeout(200);
    await this.page.waitForSelector('table tbody tr td');
    const fullName = await this.table.getCell(0, 2);
    const fullNameText = (await fullName.textContent())?.trim();
    return fullNameText;
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
        await fullName.click({ button: 'right' });
        await this.goToProfileOption.click();
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

    await fullName.click({ button: 'right' });
    await this.goToProfileOption.click();
    return randomIndex;
  }

  async selectMultipleRegistrations(selectionCount: number) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    for (let i = 1; i <= selectionCount; i++) {
      const rowCheckbox = await this.table.getCell(i, 0);
      await rowCheckbox.click();
    }
  }

  async performActionWithRightClick(action: string, row = 0) {
    await this.table.tableRows.nth(row).click({ button: 'right' });
    await this.page.getByLabel(action).click();
  }

  async clickAndSelectExportOption(option: string) {
    await this.exportButton.click();
    await this.page.getByRole('menuitem', { name: option }).click();
  }

  async clickProceedToExport() {
    await this.proceedButton.click();
  }

  async exportAndAssertData(
    expectedColumns: string[],
    assertionData: Record<string, unknown>,
    filterContext?: string,
  ) {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      await this.clickProceedToExport(),
    ]);

    // Wait for the download to complete
    const downloadDir = './downloads';
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);

    // Read and parse the .xlsx file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

    let rowToAssert: Record<string, unknown> | undefined = data[0];
    if (filterContext) {
      // Find the row that matches the filter context
      rowToAssert = data.find((row) => {
        return Object.values(row).some((value) =>
          value?.toString().includes(filterContext),
        );
      });

      if (!rowToAssert) {
        throw new Error('No row matches the filter context');
      }
    }

    if (!rowToAssert) {
      throw new Error('No data found to assert');
    }
    // Extract the column names from the first object in the array
    const actualColumns = Object.keys(rowToAssert);

    // Normalize the column names for comparison (lowercase and trim whitespace)
    const normalizedExpectedColumns = expectedColumns.map((col) =>
      col.toLowerCase().trim(),
    );
    const normalizedActualColumns = actualColumns.map((col) =>
      col.toLowerCase().trim(),
    );

    // Check if every expected column is present in the actual columns
    const columnsPresent = normalizedExpectedColumns.every((expectedCol) =>
      normalizedActualColumns.includes(expectedCol),
    );

    // This approach does not require the counts to match exactly, focusing on presence
    if (
      !columnsPresent ||
      normalizedExpectedColumns.length !== normalizedActualColumns.length
    ) {
      throw new Error('Column validation failed');
    }

    // Assert the values of the row
    Object.entries(assertionData).forEach(([key, value]) => {
      expect(rowToAssert[key]).toBe(value);
    });
  }

  async exportDebitCardData({
    registrationStatus,
    paId,
    balance,
    spentThisMonth,
    isCurrentWallet,
  }: ExportDebitCardAssertionData) {
    const assertionData = {
      registrationStatus,
      paId,
      balance,
      spentThisMonth,
      isCurrentWallet,
    };

    await this.exportAndAssertData(expectedColumnsDebitCard, assertionData);
  }
}

export default RegistrationsPage;
