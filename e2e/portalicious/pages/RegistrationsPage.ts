import { expect, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Page } from 'playwright';
import * as XLSX from 'xlsx';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';

import { expectedSortedArraysToEqual } from '../utils';

const expectedColumnsSelectedRegistrationsExport = [
  'referenceId',
  'id',
  'status',
  'phoneNumber',
  'preferredLanguage',
  'paymentAmountMultiplier',
  'paymentCount',
  'registrationCreatedDate',
  'programFinancialServiceProviderConfigurationLabel',
  'scope',
  'namePartnerOrganization',
  'fullName',
  'whatsappPhoneNumber',
  'addressStreet',
  'addressHouseNumber',
  'addressHouseNumberAddition',
  'addressPostalCode',
  'addressCity',
];

const expectedColumnsStatusAndDataChangesExport = [
  'paId',
  'referenceId',
  'changedAt',
  'changedBy',
  'type',
  'newValue',
  'oldValue',
  'reason',
];

const expectedColumnsDuplicateRegistrationsExport = [
  'referenceId',
  'id',
  'status',
  'financialServiceProviderName',
  'programFinancialServiceProviderConfigurationLabel',
  'scope',
  'phoneNumber',
  'whatsappPhoneNumber',
  'name',
  'duplicateWithIds',
];

const expectedColumnsExportExcelFspPaymentList = [
  'referenceId',
  'amount',
  'namePartnerOrganization',
  'fullName',
  'phoneNumber',
  'whatsappPhoneNumber',
  'addressStreet',
  'addressHouseNumber',
  'addressHouseNumberAddition',
  'addressPostalCode',
  'addressCity',
];

interface ExportPaAssertionData {
  status: string;
  id: number;
  paymentAmountMultiplier: number;
  preferredLanguage: string;
  programFinancialServiceProviderConfigurationLabel: string;
  whatsappPhoneNumber?: string;
}

interface ExportStatusAndDataChangesData {
  referenceId: string;
  changedBy: string;
  type: string;
  newValue: string;
  oldValue: string;
  reason: string;
}

interface ExportDuplicateRegistrationsData {
  id: number;
  status: string;
  programFinancialServiceProviderConfigurationLabel: string;
  name: string;
  duplicateWithIds: string;
}

interface ExportExcelFspData {
  amount: number;
  fullName: string;
  addressStreet: string;
  addressHouseNumber: string;
  addressPostalCode: string;
}

class RegistrationsPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly sendMessageDialogPreview: Locator;
  readonly exportButton: Locator;
  readonly proceedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.sendMessageDialogPreview = this.page.getByTestId(
      'send-message-dialog-preview',
    );
    this.exportButton = this.page.getByRole('button', { name: 'Export' });
    this.proceedButton = this.page.getByRole('button', { name: 'Proceed' });
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
    await expect(this.page.locator('textarea')).toBeDisabled();
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
    await this.page.waitForTimeout(200);
    await this.page.waitForSelector('table tbody tr td');
    const registrationStatus = await this.table.getCell(0, 3);
    const statusText = (await registrationStatus.textContent())?.trim();
    if (!statusText) {
      throw new Error('Could not find full name in the table');
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

  async exportAndAssertData(
    expectedColumns: string[],
    assertionData: Record<string, unknown>,
    registrationIndex: number,
    filterContext?: string,
    validateMinRowCount?: { condition: boolean; minRowCount: number },
    validateExactRowCount?: { condition: boolean; rowCount: number },
  ) {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.clickProceedToExport(),
    ]);

    const downloadDir = path.join(__dirname, '../../downloads');
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

    if (validateMinRowCount?.condition) {
      if (data.length <= validateMinRowCount.minRowCount) {
        throw new Error(
          `Row count validation failed. Expected more than ${validateMinRowCount.minRowCount} rows, but found ${data.length}.`,
        );
      }
    }

    if (validateExactRowCount?.condition) {
      if (data.length !== validateExactRowCount.rowCount) {
        throw new Error(
          `Row count validation failed. Expected ${validateExactRowCount.rowCount} rows, but found ${data.length}.`,
        );
      }
    }

    const rowToAssert = filterContext
      ? data.find((row) =>
          Object.values(row).some((value) =>
            value?.toString().includes(filterContext),
          ),
        )
      : data[registrationIndex];

    if (!rowToAssert) throw new Error('No data found to assert');

    const actualColumns = Object.keys(rowToAssert).map((col) =>
      col.toLowerCase().trim(),
    );
    const normalizedExpectedColumns = expectedColumns.map((col) =>
      col.toLowerCase().trim(),
    );

    const missingColumns = normalizedExpectedColumns.filter(
      (col) => !actualColumns.includes(col),
    );
    const extraColumns = actualColumns.filter(
      (col) => !normalizedExpectedColumns.includes(col),
    );

    if (missingColumns.length > 0 || extraColumns.length > 0) {
      const errorMessage = [
        'Column validation failed:',
        missingColumns.length > 0
          ? `Missing columns: ${missingColumns.join(', ')}`
          : '',
        extraColumns.length > 0
          ? `Extra columns: ${extraColumns.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join(' ');

      throw new Error(errorMessage);
    }

    const mappedAssertionData = Object.keys(assertionData).reduce(
      (acc, key) => {
        const mappedKey = key.toLowerCase().trim();
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
      expect(normalizedRowToAssert[key]).toBe(value);
    });
  }

  async exportAndAssertSelectedRegistrations(
    registrationIndex: number,
    {
      status,
      id,
      paymentAmountMultiplier,
      preferredLanguage,
      programFinancialServiceProviderConfigurationLabel,
    }: ExportPaAssertionData,
    validateMinRowCount?: { condition: boolean; minRowCount: number },
  ) {
    const assertionData = {
      status,
      id,
      paymentAmountMultiplier,
      preferredLanguage,
      programFinancialServiceProviderConfigurationLabel,
    };
    await this.exportAndAssertData(
      expectedColumnsSelectedRegistrationsExport,
      assertionData,
      registrationIndex,
      undefined,
      validateMinRowCount,
    );
  }

  async exportAndAssertStatusAndDataChanges(
    registrationIndex: number,
    {
      referenceId,
      changedBy,
      type,
      newValue,
      oldValue,
      reason,
    }: ExportStatusAndDataChangesData,
    validateMinRowCount?: { condition: boolean; minRowCount: number },
  ) {
    const assertionData = {
      referenceId,
      changedBy,
      type,
      newValue,
      oldValue,
      reason,
    };
    await this.exportAndAssertData(
      expectedColumnsStatusAndDataChangesExport,
      assertionData,
      registrationIndex,
      referenceId,
      validateMinRowCount,
    );
  }

  async exportAndAssertDuplicates(
    registrationIndex: number,
    {
      id,
      status,
      programFinancialServiceProviderConfigurationLabel,
      name,
      duplicateWithIds,
    }: ExportDuplicateRegistrationsData,
    validateMinRowCount?: { condition: boolean; minRowCount: number },
  ) {
    const assertionData = {
      id,
      status,
      programFinancialServiceProviderConfigurationLabel,
      name,
      duplicateWithIds,
    };
    await this.exportAndAssertData(
      expectedColumnsDuplicateRegistrationsExport,
      assertionData,
      registrationIndex,
      undefined,
      validateMinRowCount,
    );
  }

  async exportAndAssertExcelFspList(
    registrationIndex: number,
    {
      amount,
      fullName,
      addressStreet,
      addressHouseNumber,
      addressPostalCode,
    }: ExportExcelFspData,
    validateExactRowCount?: { condition: boolean; rowCount: number },
  ) {
    const assertionData = {
      amount,
      fullName,
      addressStreet,
      addressHouseNumber,
      addressPostalCode,
    };
    await this.exportAndAssertData(
      expectedColumnsExportExcelFspPaymentList,
      assertionData,
      registrationIndex,
      undefined,
      undefined,
      validateExactRowCount,
    );
  }

  async assertDuplicateColumnValues(expectedValues: string[]) {
    const duplicateColumnValues = await this.table.getTextArrayFromColumn(5);
    expectedSortedArraysToEqual(duplicateColumnValues, expectedValues);
  }
}

export default RegistrationsPage;
