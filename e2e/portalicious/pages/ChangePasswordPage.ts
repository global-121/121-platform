import { Locator, Page } from 'playwright';
import BasePage from './BasePage';

class ChangePasswordPage extends BasePage {
  page: Page;
  readonly currentPassword: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly changePasswordButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.currentPassword = this.page.getByLabel('Current Password');
    this.newPassword = this.page.getByLabel('New Password');
    this.confirmPassword = this.page.getByLabel('Confirm Password');
    this.changePasswordButton = this.page.getByRole('button', {
      name: 'Change password',
    });
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
    await this.changePasswordButton.click();
  }

  async assertChangePasswordSuccessPopUp() {
    await this.validateToastMessage('Your password was successfully changed.');
  }
}

export default ChangePasswordPage;
