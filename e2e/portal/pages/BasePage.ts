import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Locator, Page } from 'playwright';
import * as XLSX from 'xlsx';

import { PrimeNGDropdown } from '@121-e2e/portal/components/PrimeNGDropdown';

class BasePage {
  readonly page: Page;
  readonly logo: Locator;
  readonly languageDropdown: PrimeNGDropdown;
  readonly projectHeader: Locator;
  readonly sidebar: Locator;
  readonly sidebarToggle: Locator;
  readonly accountDropdown: Locator;
  readonly formError: Locator;
  readonly toast: Locator;
  readonly chooseFileButton: Locator;
  readonly dialog: Locator;
  readonly importButton: Locator;
  readonly importFileButton: Locator;
  readonly ignoreDuplicationDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    this.logo = this.page.getByTestId('logo');
    this.languageDropdown = new PrimeNGDropdown({
      page,
      testId: 'language-dropdown',
    });
    this.projectHeader = this.page.getByTestId('project-header');
    this.sidebar = this.page.getByTestId('sidebar');
    this.sidebarToggle = this.page.getByTestId('sidebar-toggle');
    this.accountDropdown = this.page.getByRole('button', { name: 'Account' });
    this.formError = this.page.getByTestId('form-error');
    this.toast = this.page.getByRole('alert');
    this.chooseFileButton = this.page.getByRole('button', {
      name: 'Choose file',
    });
    this.dialog = this.page.getByRole('alertdialog');
    this.importButton = this.page.getByRole('button', { name: 'Import' });
    this.importFileButton = this.page.getByRole('button', {
      name: 'Import file',
    });
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
    pageName: 'Registrations' | 'Payments' | 'Monitoring' | 'Team',
  ) {
    await this.projectHeader.getByRole('tab', { name: pageName }).click();
  }

  async selectProgram(programName: string) {
    await this.page.getByRole('link', { name: programName }).click();
  }

  async changeLanguage(language: string) {
    await this.openSidebar();
    await this.languageDropdown.selectOption({ label: language });
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
    await expect(this.toast).toBeVisible();
    expect(await this.toast.textContent()).toContain(message);
    await this.dismissToast();
  }

  async dismissToast() {
    await this.toast.getByRole('button').click();
    await expect(this.toast).toBeHidden();
  }

  async validateFormError({ errorText }: { errorText: string }) {
    await this.page.waitForLoadState('networkidle');
    await this.formError.waitFor();

    const errorString = await this.formError.textContent();
    expect(await this.formError.isVisible()).toBe(true);
    expect(errorString).toContain(errorText);
  }

  async validateMultipleFormErrors({ errorText }: { errorText: string }) {
    await this.page.waitForLoadState('networkidle');
    const formErrors = await this.formError.all();

    for (const formError of formErrors) {
      await formError.waitFor();
      const errorString = await formError.textContent();
      expect(await formError.isVisible()).toBe(true);
      expect(errorString).toContain(errorText);
    }
  }

  async openCreateNewProject() {
    await this.page.getByRole('button', { name: 'Add project' }).click();
  }

  async importRegistrations(filePath: string) {
    await this.importButton.click();
    await this.chooseAndUploadFile(filePath);
    await this.importFileButton.click();
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
  }: {
    filePath: string;
    minRowCount?: number;
    expectedRowCount?: number;
    format: 'xlsx' | 'csv';
    orderOfDataIsImportant?: boolean;
    excludedColumns?: string[];
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

    let dataToValidate: string | undefined = data[0];

    if (!orderOfDataIsImportant) {
      // sort the data to make the snapshot more stable
      dataToValidate = data.sort((a, b) => a.localeCompare(b))[0];
    }

    const headerCells = headerRow.split(',');
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

    let snapshotContent = headerCells.join(',');

    if (data.length > 0) {
      snapshotContent += '\n' + dataCells.join(',');
    }

    // make sure we have the expected columns, and also validate the first row of data
    expect(snapshotContent).toMatchSnapshot(`exported-${format}.csv`);
  }
}

export default BasePage;
