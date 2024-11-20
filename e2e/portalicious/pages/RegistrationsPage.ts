import { expect, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Page } from 'playwright';
import * as XLSX from 'xlsx';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';

const expectedColumnsSelectedRegistrationsExport = [
  'referenceId',
  'id',
  'status',
  'phoneNumber',
  'preferredLanguage',
  'paymentAmountMultiplier',
  'paymentCount',
  'registrationCreatedDate',
  'fspDisplayName',
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
];

const expectedColumnsDuplicateRegistrationsExport = [
  'referenceId',
  'id',
  'status',
  'fsp',
  'scope',
  'phoneNumber',
  'whatsappPhoneNumber',
  'name',
  'duplicateWithIds',
];

interface ExportPaAssertionData {
  status: string;
  id: number;
  paymentAmountMultiplier: number;
  preferredLanguage: string;
  fspDisplayName: string;
  whatsappPhoneNumber?: string;
}

interface ExportStatusAndDataChangesData {
  paId: number;
  changedBy: string;
  type: string;
  newValue: string;
  oldValue: string;
}

interface ExportDuplicateRegistrationsData {
  id: number;
  status: string;
  fsp: string;
  name: string;
  duplicateWithIds: string;
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
    validateRowCount?: { condition: boolean; minRowCount: number },
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

    if (validateRowCount?.condition) {
      if (data.length <= validateRowCount.minRowCount) {
        throw new Error(
          `Row count validation failed. Expected more than ${validateRowCount.minRowCount} rows, but found ${data.length}.`,
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

    if (
      !normalizedExpectedColumns.every((col) => actualColumns.includes(col)) ||
      normalizedExpectedColumns.length !== actualColumns.length
    ) {
      throw new Error('Column validation failed');
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
      fspDisplayName,
    }: ExportPaAssertionData,
    validateRowCount?: { condition: boolean; minRowCount: number },
  ) {
    const assertionData = {
      status,
      id,
      paymentAmountMultiplier,
      preferredLanguage,
      fspDisplayName,
    };
    await this.exportAndAssertData(
      expectedColumnsSelectedRegistrationsExport,
      assertionData,
      registrationIndex,
      undefined,
      validateRowCount,
    );
  }

  async exportAndAssertStatusAndDataChanges(
    registrationIndex: number,
    {
      paId,
      changedBy,
      type,
      newValue,
      oldValue,
    }: ExportStatusAndDataChangesData,
    validateRowCount?: { condition: boolean; minRowCount: number },
  ) {
    const assertionData = {
      paId,
      changedBy,
      type,
      newValue,
      oldValue,
    };
    await this.exportAndAssertData(
      expectedColumnsStatusAndDataChangesExport,
      assertionData,
      registrationIndex,
      undefined,
      validateRowCount,
    );
  }

  async exportAndAssertDuplicates(
    registrationIndex: number,
    {
      id,
      status,
      fsp,
      name,
      duplicateWithIds,
    }: ExportDuplicateRegistrationsData,
    validateRowCount?: { condition: boolean; minRowCount: number },
  ) {
    const assertionData = {
      id,
      status,
      fsp,
      name,
      duplicateWithIds,
    };
    await this.exportAndAssertData(
      expectedColumnsDuplicateRegistrationsExport,
      assertionData,
      registrationIndex,
      undefined,
      validateRowCount,
    );
  }
}

export default RegistrationsPage;
