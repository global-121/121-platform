import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';
import * as XLSX from 'xlsx';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';

import { expectedSortedArraysToEqual } from '../utils';

const expectedImportRegistrationsTemplateColumnsPvProject = [
  'referenceId',
  'programFinancialServiceProviderConfigurationName',
  'phoneNumber',
  'preferredLanguage',
  'paymentAmountMultiplier',
  'maxPayments',
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

const expectedColumnsSelectedRegistrationsExport = [
  'referenceId',
  'id',
  'status',
  'phoneNumber',
  'preferredLanguage',
  'paymentAmountMultiplier',
  'paymentCount',
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

type ExportRegistrationsAssertionData = {
  status: string;
  id: number;
  paymentAmountMultiplier: number;
  preferredLanguage: string;
  programFinancialServiceProviderConfigurationLabel: string;
  whatsappPhoneNumber?: string;
};

type ExportStatusAndDataChangesAssertionData = {
  referenceId: string;
  changedBy: string;
  type: string;
  newValue: string;
  oldValue: string;
  reason: string;
};

type ExportDuplicateRegistrationsAssertionData = {
  id: number;
  status: string;
  programFinancialServiceProviderConfigurationLabel: string;
  name: string;
  duplicateWithIds: string;
};

type ExportExcelFspAssertionData = {
  amount: number;
  fullName: string;
  addressStreet: string;
  addressHouseNumber: string;
  addressPostalCode: string;
};

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

  async validateCSV({
    expectedColumns,
    filePath,
    expectedDataLength,
  }: {
    expectedColumns?: string[];
    expectedDataLength: number;
    filePath: string;
  }) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      header: 1,
    }) as unknown[][];
    // Get header row (first row)
    const headers = data[0] as string[];

    if (expectedColumns) {
      // Verify that all expected columns are present
      const missingColumns = expectedColumns.filter(
        (expectedCol) => !headers.includes(expectedCol),
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Template validation failed. Missing columns: ${missingColumns.join(', ')}`,
        );
      }

      // Verify the template doesn't have extra columns
      if (headers.length > expectedColumns.length) {
        const extraColumns = headers.filter(
          (header) => !expectedColumns.includes(header),
        );
        throw new Error(
          `Template validation failed. Found unexpected columns: ${extraColumns.join(', ')}`,
        );
      }
    } else {
      expect(headers).toMatchSnapshot();
    }

    expect(data.length - 1).toEqual(expectedDataLength);

    return true;
  }

  async downloadAndValidateTemplate(expectedColumns: string[]) {
    await this.importButton.click();

    const filePath = await this.downloadFile(
      this.downloadTemplateButton.click(),
    );

    await this.validateCSV({
      expectedColumns,
      expectedDataLength: 0, // Verify the template is empty (contains only header row)
      filePath,
    });

    return true;
  }

  async assertExportButtonIsHidden() {
    await expect(this.exportButton).toBeHidden();
  }

  async clickProceedToExport() {
    await this.proceedButton.click();
  }

  async exportAndAssertData({
    expectedColumns,
    assertionData,
    registrationIndex,
    filterContext,
    validateMinRowCount,
    validateExactRowCount,
  }: {
    expectedColumns: string[];
    assertionData: Record<string, unknown>;
    registrationIndex: number;
    filterContext?: string;
    validateMinRowCount?: { condition: boolean; minRowCount: number };
    validateExactRowCount?: { condition: boolean; rowCount: number };
  }) {
    const filePath = await this.downloadFile(this.clickProceedToExport());

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
    assertionData: ExportRegistrationsAssertionData,
    validateMinRowCount?: { condition: boolean; minRowCount: number },
  ) {
    await this.exportAndAssertData({
      expectedColumns: expectedColumnsSelectedRegistrationsExport,
      assertionData,
      registrationIndex,
      validateMinRowCount,
    });
  }

  async exportAndAssertStatusAndDataChanges(
    registrationIndex: number,
    assertionData: ExportStatusAndDataChangesAssertionData,
    validateMinRowCount?: { condition: boolean; minRowCount: number },
  ) {
    await this.exportAndAssertData({
      expectedColumns: expectedColumnsStatusAndDataChangesExport,
      assertionData,
      registrationIndex,
      filterContext: assertionData.referenceId,
      validateMinRowCount,
    });
  }

  async exportAndAssertDuplicates(
    registrationIndex: number,
    assertionData: ExportDuplicateRegistrationsAssertionData,
    validateMinRowCount?: { condition: boolean; minRowCount: number },
  ) {
    await this.exportAndAssertData({
      expectedColumns: expectedColumnsDuplicateRegistrationsExport,
      assertionData,
      registrationIndex,
      validateMinRowCount,
    });
  }

  async exportAndAssertExcelFspList(
    registrationIndex: number,
    assertionData: ExportExcelFspAssertionData,
    validateExactRowCount?: { condition: boolean; rowCount: number },
  ) {
    await this.exportAndAssertData({
      expectedColumns: expectedColumnsExportExcelFspPaymentList,
      assertionData,
      registrationIndex,
      validateExactRowCount,
    });
  }

  async assertImportTemplateForPvProgram() {
    await this.downloadAndValidateTemplate(
      expectedImportRegistrationsTemplateColumnsPvProject,
    );
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
