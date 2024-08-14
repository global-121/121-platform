import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

class ChangePasswordPage {
  page: Page;
  readonly currentPassword: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly changePasswordButton: Locator;
  readonly currentPasswordError: Locator;
  readonly confirmPasswordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.currentPassword = this.page.getByTestId('current-password');
    this.newPassword = this.page.getByTestId('new-password');
    this.confirmPassword = this.page.getByTestId('confirm-password');
    this.changePasswordButton = this.page.getByTestId('change-password-button');
    this.currentPasswordError = this.page.getByTestId(
      'change-password-current-password-error',
    );
    this.confirmPasswordError = this.page.getByTestId(
      'change-password-confirm-password-does-not-match-error',
    );
  }

  async fillInChangePassword({
    currentPassword = '',
    newPassword,
    confirmPassword,
  }: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    await this.currentPassword.fill(currentPassword);
    await this.newPassword.fill(newPassword);
    await this.confirmPassword.fill(confirmPassword);
  }

  async submitChangePassword() {
    await this.changePasswordButton.getByRole('button').click();
  }

  async assertChangePasswordSuccessPopUp() {
    const popUp = this.page.getByRole('alertdialog');

    await popUp.isVisible();
    await popUp.isHidden();
  }

  async validateGenericChangePasswordError({
    errorText,
    locator,
  }: {
    errorText: string;
    locator: Locator;
  }) {
    await this.page.waitForLoadState('networkidle');
    await locator.waitFor();

    const errorString = await locator.textContent();
    expect(errorString).toContain(errorText);
  }

  async validateChangePasswordError({ errorText }: { errorText: string }) {
    await this.validateGenericChangePasswordError({
      errorText,
      locator: this.currentPasswordError,
    });
  }

  async validateChangePasswordConfirmPasswordError({
    errorText,
  }: {
    errorText: string;
  }) {
    await this.validateGenericChangePasswordError({
      errorText,
      locator: this.confirmPasswordError,
    });
  }
}

export default ChangePasswordPage;
