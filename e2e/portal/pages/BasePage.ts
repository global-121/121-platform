import { expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { Locator, Page } from 'playwright';
import * as XLSX from 'xlsx';

import { PrimeNGDropdown } from '@121-e2e/portal/components/PrimeNGDropdown';

class BasePage {
  readonly page: Page;
  readonly logo: Locator;
  readonly localeDropdown: PrimeNGDropdown;
  readonly programHeader: Locator;
  readonly sidebar: Locator;
  readonly sidebarToggle: Locator;
  readonly accountDropdown: Locator;
  readonly formError: Locator;
  readonly toast: Locator;
  readonly chooseFileButton: Locator;
  readonly dialog: Locator;
  readonly ignoreDuplicationDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    this.logo = this.page.getByTestId('logo');
    this.localeDropdown = new PrimeNGDropdown({
      page,
      testId: 'locale-dropdown',
    });
    this.programHeader = this.page.getByTestId('program-header');
    this.sidebar = this.page.getByTestId('sidebar');
    this.sidebarToggle = this.page.getByTestId('sidebar-toggle');
    this.accountDropdown = this.page.getByRole('button', { name: 'Account' });
    this.formError = this.page.getByTestId('form-error');
    this.toast = this.page.getByRole('alert');
    this.chooseFileButton = this.page.getByRole('button', {
      name: 'Choose file',
    });
    this.dialog = this.page.getByRole('alertdialog');
    this.ignoreDuplicationDialog = this.page.getByTestId(
      'ignore-duplication-dialog',
    );
  }

  async openSidebar() {
    await this.sidebarToggle.click();
  }

  async navigateToPage(pageName: string) {
    await this.openSidebar();
    await this.sidebar.getByRole('link', { name: pageName }).click();
  }

  async navigateToProgramPage(
    pageName: 'Registrations' | 'Payments' | 'Monitoring' | 'Settings',
  ) {
    const tab = this.programHeader.getByRole('tab', { name: pageName });
    await expect(async () => {
      await expect(tab).toBeVisible();
      await tab.click();
    }).toPass({ timeout: 5000 });
  }

  async navigateToProgramSettingsPage(
    pageName: 'Program information' | 'Program team',
  ) {
    await this.navigateToProgramPage('Settings');
    const link = this.page.getByRole('link', { name: pageName });
    await expect(async () => {
      await expect(link).toBeVisible();
      await link.click();
    }).toPass({ timeout: 5000 });
  }

  async selectProgram(programName: string) {
    await this.page.getByRole('link', { name: programName }).click();
  }

  async changeLanguage(language: string) {
    await this.openSidebar();
    await this.localeDropdown.selectOption({ label: language });
  }

  async openAccountDropdown() {
    await this.accountDropdown.click();
  }

  async selectAccountOption(option: string) {
    await this.openAccountDropdown();
    await this.page.getByRole('menuitem', { name: option }).click();
  }

  async validateToastMessage(message: string) {
    await expect(this.toast).toBeVisible();
    expect(await this.toast.textContent()).toContain(message);
    await expect(this.toast).toBeHidden({
      timeout: 6000, // by default, toasts are visible for 5s
    });
  }

  // To speed tests up we can validate the toast message and close it
  // without waiting for the toast to disappear after 6 seconds
  async validateToastMessageAndClose(message: string) {
    await expect(this.toast).toBeVisible({ timeout: 5000 });
    expect(await this.toast.textContent()).toContain(message);
    await this.dismissToast();
  }

  async dismissToastIfVisible(message?: string) {
    let toastLocator = this.toast;
    if (message) {
      toastLocator = this.toast.filter({ hasText: message });
    }
    // Handle multiple toasts, only dismiss the first visible one matching the filter
    const visibleToasts = await toastLocator.all();
    for (const toast of visibleToasts) {
      if (await toast.isVisible()) {
        await toast.getByRole('button').click();
        await expect(toast).toBeHidden();
        break;
      }
    }
  }

  async dismissToast() {
    await this.toast.getByRole('button').click();
    await expect(this.toast).toBeHidden();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async validateFormError({ errorText }: { errorText: string }) {
    await this.page.waitForLoadState('networkidle');
    await this.formError.waitFor();

    const errorString = await this.formError.textContent();
    expect(await this.formError.isVisible()).toBe(true);
    expect(errorString).toContain(errorText);
  }

  async chooseAndUploadFile(filePath: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.chooseFileButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  async goto(path: string) {
    const defaultLanguage = 'en-GB';
    path = `${defaultLanguage}${path}`;
    await this.page.goto(path);
  }

  async validateErrorMessage(errorMessage: string) {
    const errorElement = this.page
      .locator('app-form-error')
      .filter({ hasText: errorMessage });
    await expect(errorElement).toContainText(errorMessage);
  }

  /**
   * Downloads a file triggered by a specific action on the page.
   *
   * @param {Promise<unknown>} triggerDownloadPromise - A promise representing the action that triggers the download
   * (e.g., a button click). This promise should not be awaited before calling this function.
   * @returns {Promise<string>} - A promise that resolves to the file path where the downloaded file is saved.
   * @throws {Error} - Throws an error if the download event fails or if there are issues saving the file.
   */
  async downloadFile(triggerDownloadPromise: Promise<unknown>) {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      triggerDownloadPromise,
    ]);

    const downloadDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);

    return filePath;
  }

  async validateExportedFile({
    filePath,
    minRowCount,
    expectedRowCount,
    format,
    orderOfDataIsImportant = false,
    excludedColumns = [],
    snapshotName,
    sortFunction,
  }: {
    filePath: string;
    minRowCount?: number;
    expectedRowCount?: number;
    format: 'xlsx' | 'csv';
    orderOfDataIsImportant?: boolean;
    excludedColumns?: string[];
    snapshotName?: string;
    sortFunction?: (a: string[], b: string[], headerCells: string[]) => number;
  }) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // convert to csv format for easier snapshotting
    const csvSheet = XLSX.utils.sheet_to_csv(sheet);

    // remove the first row (header) from the data
    const [headerRow, ...data] = csvSheet.split('\n');

    if (!!minRowCount) {
      expect(data.length).toBeGreaterThanOrEqual(minRowCount);
    }

    if (!!expectedRowCount) {
      expect(data.length).toEqual(expectedRowCount);
    }

    const headerCells = headerRow.split(',');

    // sort the data to make the snapshot more stable
    if (sortFunction) {
      data.sort((a, b) =>
        sortFunction(a.split(','), b.split(','), headerCells),
      );
    } else if (!orderOfDataIsImportant) {
      data.sort((a, b) => a.localeCompare(b));
    }

    const dataToValidate = data[0];
    const dataCells = dataToValidate?.split(',') ?? [];

    // remove excluded columns from the header and data
    excludedColumns.forEach((column) => {
      const index = headerCells.indexOf(column);
      if (index > -1) {
        headerCells.splice(index, 1);
        dataCells.splice(index, 1);
      } else {
        throw new Error(
          `Column to exclude "${column}" not found in header row`,
        );
      }
    });

    let normalizedDownloadedFile = headerCells.join(',');

    if (data.length > 0) {
      normalizedDownloadedFile += '\n' + dataCells.join(',');
    }

    // make sure we have the expected columns, and also validate the first row of data
    expect(normalizedDownloadedFile).toMatchSnapshot(
      snapshotName ?? `exported-${format}.csv`,
    );
  }
}

export default BasePage;
