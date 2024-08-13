import { Locator, Page } from 'playwright';

class ChangePasswordPage {
  page: Page;
  readonly currentPassword: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly changePasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.currentPassword = this.page.getByTestId('current-password');
    this.newPassword = this.page.getByTestId('new-password');
    this.confirmPassword = this.page.getByTestId('confirm-password');
    this.changePasswordButton = this.page.getByTestId('change-password-button');
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
    await this.page
      .getByText('Your password was successfully changed.')
      .isVisible();
  }
}

export default ChangePasswordPage;
