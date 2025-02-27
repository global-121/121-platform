import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import { PrimeNGDropdown } from '@121-e2e/portalicious/components/PrimeNGDropdown';

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

  async chooseAndUploadFile(filePath: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.chooseFileButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }
}

export default BasePage;
