import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Locator, Page } from 'playwright';
import * as XLSX from 'xlsx';

import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/financial-service-providers/financial-service-providers-settings.const';

const fsp = FINANCIAL_SERVICE_PROVIDER_SETTINGS.find(
  (fsp) => fsp.name === FinancialServiceProviders.intersolveVisa,
);

const labelVisaEn = fsp ? fsp.defaultLabel.en : undefined;

const paymentLabel =
  englishTranslations.page.program['program-people-affected'].actions.doPayment;
const filteredRecipients =
  englishTranslations.page.program['table-filter-row']['filtered-results'];
const sendMessageAction =
  englishTranslations.page.program['program-people-affected'].actions
    .sendMessage;
const debitCardUsage =
  englishTranslations.page.program['export-list'][
    'intersolve-visa-card-details'
  ]['btn-text'];
const paymentReport =
  englishTranslations.page.program['export-list']['payment']['btn-text'];

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

const expectedColumnsPayment = [
  'referenceId',
  'id',
  'status',
  'payment',
  'timestamp',
  'registrationStatus',
  'phoneNumber',
  'paymentAmountMultiplier',
  'amount',
  'financialserviceprovider',
  'firstName',
  'lastName',
  'whatsappPhoneNumber',
];
interface BulkActionContent {
  textLocator: Locator;
  expectedText: string;
  bulkAction: string;
  maxRetries?: number;
}

interface ExportDebitCardAssertionData {
  registrationStatus: string;
  paId: number;
  balance: number;
  spentThisMonth: number;
  isCurrentWallet: boolean;
}

interface ExportPaymentAssertionData {
  status: string;
  amount: number;
}

class TableModule {
  readonly page: Page;
  readonly filterInput: Locator;
  readonly button: Locator;
  readonly textLabel: Locator;
  readonly bulkActionsDropdown: Locator;
  readonly informationPopUpButton: Locator;
  readonly paCell: Locator;
  readonly filterSelectionDropdown: Locator;
  readonly filterStatusDropdown: Locator;
  readonly exportDataButton: Locator;
  readonly bulkImportRegistrationsButton: Locator;
  readonly debitCardDataExportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filterInput = this.page.locator('input[type="text"]');
    this.button = this.page.locator('ion-button');
    this.textLabel = this.page.locator('ion-text');
    this.bulkActionsDropdown = this.page.getByTestId(
      'program-people-affected-bulk-actions',
    );
    this.informationPopUpButton = this.page.getByTestId(
      'information-popup-button',
    );
    this.paCell = this.page.getByTestId('pa-table-cell');
    this.filterSelectionDropdown = this.page.getByTestId(
      'select-typhead-filter-selection-dropdown',
    );
    this.filterStatusDropdown = this.page.getByTestId('table-filter-status');
    this.exportDataButton = this.page.getByTestId(
      'table-filter-data-export-button',
    );
    this.bulkImportRegistrationsButton = this.page.getByTestId(
      'registration-validation-bulk-import-button',
    );
    this.debitCardDataExportButton = this.page.getByTestId(
      'confirm-prompt-button-default',
    );
  }

  static getRow(rowIndex: number) {
    return `//datatable-row-wrapper[${rowIndex}]`;
  }
  static getTable(tableIndex: number) {
    return `/datatable-body-row/div[${tableIndex}]/`;
  }
  static getCollumn(collumnIndex: number) {
    return `datatable-body-cell[${collumnIndex}]`;
  }
  static getCellValueTableLeft(row: number, collumn: number) {
    return (
      TableModule.getRow(row) +
      TableModule.getTable(1) +
      TableModule.getCollumn(collumn)
    );
  }
  static getCellValueTableRight(row: number, collumn: number) {
    return (
      TableModule.getRow(row) +
      TableModule.getTable(2) +
      TableModule.getCollumn(collumn)
    );
  }

  async clickOnPaNumber(rowIndex: number) {
    await this.page
      .locator(TableModule.getCellValueTableLeft(rowIndex, 2))
      .click();
  }

  async clickOnPaPayments(rowIndex: number) {
    await this.page
      .locator(TableModule.getCellValueTableRight(rowIndex, 7))
      .click();
  }

  async clickOnPaMessage(rowIndex: number) {
    await this.page
      .locator(TableModule.getCellValueTableRight(rowIndex, 5))
      .click();
  }

  async selectTable(tableName: string) {
    await this.button.filter({ hasText: tableName }).click();
  }

  async quickFilter(filter: string) {
    try {
      await this.filterInput.waitFor({ state: 'visible' });
      await this.filterInput.fill(filter);

      const applyFilterButtonLocator = this.button.filter({
        hasText: 'Apply Filter',
      });
      await applyFilterButtonLocator.waitFor({ state: 'visible' });
      await applyFilterButtonLocator.click();
    } catch (error) {
      console.error(`Failed to apply quick filter: ${error}`);
    }
  }

  async validateQuickFilterResultsNumber({
    expectedNumber,
  }: {
    expectedNumber: number;
  }) {
    const textLocator = this.textLabel.filter({
      hasText: filteredRecipients,
    });
    const expectedText = `${filteredRecipients}: ${expectedNumber}`;

    if (
      !(await this.retryCheckTextContent({
        textLocator,
        expectedText,
      }))
    ) {
      expect(expectedText).toBe(await textLocator.textContent());
    }
  }

  async retryCheckTextContent({
    textLocator,
    expectedText,
    maxRetries = 3,
  }: {
    textLocator: Locator;
    expectedText: string;
    maxRetries?: number;
  }) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const textContent = await textLocator.textContent();
      if (textContent?.trim() === expectedText) return true;
      if (attempt < maxRetries) {
        await this.page.reload();
        await this.page.waitForTimeout(1000);
      }
    }
    return false;
  }

  async applyBulkAction(
    option: Parameters<typeof this.bulkActionsDropdown.selectOption>[0],
  ) {
    await this.page.reload();
    await this.page.waitForTimeout(1000);
    await this.bulkActionsDropdown.selectOption(option);
    await this.page.getByLabel('Select', { exact: true }).click();
    await this.button.filter({ hasText: 'Apply action' }).click();
  }

  async selectBulkAction({ option }: { option: string }) {
    await this.page.reload();
    await this.page.waitForTimeout(1000);
    await this.bulkActionsDropdown.selectOption(option);
    await this.page.getByLabel('Select', { exact: true }).click();
  }

  async GetBulkActionOptions() {
    await this.page.waitForLoadState('networkidle');
    await this.bulkActionsDropdown.click();
    return await this.bulkActionsDropdown.allTextContents();
  }

  async openDataExportDropdown() {
    await this.exportDataButton.click();
  }

  async openImportPopUp() {
    await this.bulkImportRegistrationsButton.getByRole('button').click();
  }

  async validateBulkActionTargetedPasNumber({
    expectedNumber,
    bulkAction,
  }: {
    expectedNumber: number;
    bulkAction: string;
  }) {
    const textLocator = this.page
      .locator('p')
      .filter({ hasText: sendMessageAction });
    const expectedText = `${sendMessageAction} for ${expectedNumber} People Affected.`;

    if (
      !(await this.retryCheckTextContentOfBulkAction({
        textLocator,
        expectedText,
        bulkAction,
      }))
    ) {
      expect(expectedText).toBe(await textLocator.textContent());
    }
  }

  async retryCheckTextContentOfBulkAction({
    textLocator,
    expectedText,
    bulkAction,
    maxRetries = 3,
  }: BulkActionContent) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const textContent = await textLocator.textContent();
      if (textContent?.trim() === expectedText) return true;
      if (attempt < maxRetries) {
        await this.page.reload();
        await this.applyBulkAction(bulkAction);
        await this.page.waitForTimeout(1000);
      }
    }
    return false;
  }

  async selectFieldsforCustomMessage({
    selectFieldDropdownName,
    fullName,
    addPersonalizedFieldName,
    okButtonName,
  }: {
    selectFieldDropdownName: string;
    fullName: string;
    addPersonalizedFieldName: string;
    okButtonName: string;
  }) {
    const okButton = this.page.getByRole('button', {
      name: okButtonName,
    });
    await this.page
      .getByTitle(selectFieldDropdownName)
      .getByLabel(selectFieldDropdownName)
      .click();
    await this.page.getByRole('radio', { name: fullName }).click();
    await this.page
      .getByRole('button', { name: addPersonalizedFieldName })
      .click();

    await okButton.waitFor({ state: 'visible' });
    await okButton.click();

    await okButton.waitFor({ state: 'visible' });
    await okButton.click();
  }

  async validateInformationButtonsPresent() {
    await this.page.waitForLoadState('networkidle');
    const actualCount = await this.informationPopUpButton.count();
    const expectedCount = await this.paCell.count();

    if (actualCount !== expectedCount) {
      throw new Error(
        `Expected ${actualCount} elements, but found ${expectedCount}`,
      );
    }
  }

  async validateNoInformationButtonIsPresent() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.informationPopUpButton).toBeHidden();
  }

  async openPaPersonalInformation({
    buttonIndex = 0,
  }: {
    buttonIndex?: number;
  }) {
    await this.informationPopUpButton.nth(buttonIndex).click();
  }

  async openStatusFilterDropdown() {
    await this.filterStatusDropdown.click();
  }

  async openFilterDropdown() {
    await this.filterSelectionDropdown.click();
  }

  async doPayment(paymentNr: number) {
    const doPaymentLabel = paymentLabel.replace(
      '{{paymentNr}}',
      paymentNr.toString(),
    );

    await this.applyBulkAction({ label: doPaymentLabel });
  }

  async acceptBulkAction() {
    const okButton = this.page.getByRole('button', { name: 'OK' });

    await okButton.click();
    await okButton.waitFor({ state: 'visible' });
    await okButton.click();
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

    await this.exportAndAssertData(
      expectedColumnsDebitCard,
      assertionData,
      debitCardUsage,
    );
  }

  async exportPayMentData({ status, amount }: ExportPaymentAssertionData) {
    const assertionData = {
      status,
      amount,
    };
    await this.exportAndAssertData(
      expectedColumnsPayment,
      assertionData,
      paymentReport,
      'Smith',
    );
  }

  async exportAndAssertData(
    expectedColumns: string[],
    assertionData: Record<string, unknown>,
    filterButtonText: string,
    filterContext?: string,
  ) {
    const okButton = this.page.getByRole('button', { name: 'OK' });
    const exportButton = this.debitCardDataExportButton.filter({
      hasText: filterButtonText,
    });
    await exportButton.click();
    await okButton.waitFor({ state: 'visible' });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      okButton.click(),
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
      expect(rowToAssert![key]).toBe(value);
    });
  }

  async selectFspPaPii({ shouldSelectVisa }: { shouldSelectVisa: boolean }) {
    await this.page.waitForSelector(TableModule.getCellValueTableRight(1, 4));

    const count = await this.paCell.count();
    for (let i = 1; i <= count; i++) {
      const fsp = this.page.locator(TableModule.getRow(i));
      const fspText = (await fsp.textContent())?.trim();
      const isVisaFsp = fspText?.includes(labelVisaEn!);

      if (
        (shouldSelectVisa && isVisaFsp) ||
        (!shouldSelectVisa && !isVisaFsp)
      ) {
        await this.openPaPersonalInformation({ buttonIndex: i - 1 });
        return i;
      }
    }
    return -1;
  }

  async openFspProfile({ shouldIncludeVisa }: { shouldIncludeVisa: boolean }) {
    await this.page.waitForSelector(TableModule.getCellValueTableRight(1, 4));

    const count = await this.paCell.count();
    for (let i = 1; i <= count; i++) {
      const fsp = this.page.locator(TableModule.getRow(i));
      const fspText = (await fsp.textContent())?.trim();
      const isVisaFsp = fspText?.includes(labelVisaEn!);

      if (
        (shouldIncludeVisa && isVisaFsp) ||
        (!shouldIncludeVisa && !isVisaFsp)
      ) {
        await this.clickOnPaNumber(i);
        return i;
      }
    }
    return -1;
  }

  async openPaymentHistory({ rowIndex = 1 }: { rowIndex: number }) {
    await this.page.waitForSelector(TableModule.getCellValueTableRight(1, 7));
    await this.clickOnPaPayments(rowIndex);
  }

  async validateFspCell({
    rowNumber,
    fspName,
  }: {
    rowNumber: number;
    fspName: string;
  }) {
    const fsp = this.page.locator(
      TableModule.getCellValueTableRight(rowNumber, 4),
    );
    const fspText = (await fsp.textContent())?.trim();
    expect(fspText).toBe(fspName);
  }

  async selectPaByLanguage({ language }: { language: string }) {
    await this.page.waitForSelector(TableModule.getCellValueTableRight(1, 4));

    const count = await this.paCell.count();
    for (let i = 1; i <= count; i++) {
      const getRow = this.page.locator(TableModule.getRow(i));
      const rowText = (await getRow.textContent())?.trim();
      const isRequiredLanguage = rowText?.includes(language);

      if (isRequiredLanguage) {
        await this.clickOnPaNumber(i);
        return i;
      }
    }
    return -1;
  }
}

export default TableModule;
