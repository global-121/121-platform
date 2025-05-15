import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Locator, Page } from 'playwright';

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

  // Some data is already updated when the toast message is shown so to speed the test up we can validate the toast message
  // And wait for 1 second to make sure the data is updated without waiting for the toast to disappear after 6 seconds
  async validateToastMessageAndWait(message: string) {
    await expect(this.toast).toBeVisible();
    expect(await this.toast.textContent()).toContain(message);
    await this.page.waitForTimeout(1000);
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
}

export default BasePage;
