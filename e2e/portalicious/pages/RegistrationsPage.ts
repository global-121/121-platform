import { expect, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Page } from 'playwright';
import * as XLSX from 'xlsx';

import BasePage from './BasePage';
import TableComponent from './TableComponent';

const expectedColumnsPaExport = [
  'referenceid',
  'id',
  'status',
  'phonenumber',
  'preferredlanguage',
  'paymentamountmultiplier',
  'paymentcount',
  'registrationcreateddate',
  'fspdisplayname',
  'scope',
  'namepartnerorganization',
  'fullname',
  'whatsappphonenumber',
  'addressstreet',
  'addresshousenumber',
  'addresshousenumberaddition',
  'addresspostalcode',
  'addresscity',
];

interface ExportPaAssertionData {
  registrationStatus: string;
  paId: number;
  paymentAmountMultiplier: number;
  preferredLanguage: string;
  fspDisplayName: string;
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
      this.clickProceedToExport(),
    ]);

    const downloadDir = './downloads';
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<
      string,
      unknown
    >[];

    if (data.length === 0) throw new Error('No data found in the sheet');

    const rowToAssert = filterContext
      ? data.find((row) =>
          Object.values(row).some((value) =>
            value?.toString().includes(filterContext),
          ),
        )
      : data[0];

    if (!rowToAssert) throw new Error('No data found to assert');

    const actualColumns = Object.keys(rowToAssert).map((col) =>
      col.toLowerCase().trim(),
    );
    const normalizedExpectedColumns = expectedColumns.map((col) =>
      col.toLowerCase().trim(),
    );

    if (
      !normalizedExpectedColumns.every((col) => actualColumns.includes(col)) ||
      normalizedExpectedColumns.length !== actualColumns.length
    ) {
      throw new Error('Column validation failed');
    }

    const keyMapping: Record<string, string> = {
      paid: 'id',
      registrationstatus: 'status',
      paymentAmountMultiplier: 'paymentamountmultiplier',
      preferredLanguage: 'preferredlanguage',
      fspDisplayName: 'fspdisplayname',
    };

    const mappedAssertionData = Object.keys(assertionData).reduce(
      (acc, key) => {
        const mappedKey =
          keyMapping[key.toLowerCase().trim()] || key.toLowerCase().trim();
        acc[mappedKey] = assertionData[key];
        return acc;
      },
      {} as Record<string, unknown>,
    );

    const normalizedRowToAssert = Object.keys(rowToAssert).reduce(
      (acc, key) => {
        acc[key.toLowerCase().trim()] = rowToAssert[key];
        return acc;
      },
      {} as Record<string, unknown>,
    );

    Object.entries(mappedAssertionData).forEach(([key, value]) => {
      console.log(
        `Comparing key: ${key}, Expected value: ${value}, Actual value: ${normalizedRowToAssert[key]}`,
      );
      expect(normalizedRowToAssert[key]).toBe(value);
    });
  }

  async exportSelectedPaData({
    registrationStatus,
    paId,
    paymentAmountMultiplier,
    preferredLanguage,
    fspDisplayName,
  }: ExportPaAssertionData) {
    const assertionData = {
      registrationStatus,
      paId,
      paymentAmountMultiplier,
      preferredLanguage,
      fspDisplayName,
    };

    await this.exportAndAssertData(expectedColumnsPaExport, assertionData);
  }
}

export default RegistrationsPage;
