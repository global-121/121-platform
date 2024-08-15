import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';
import BasePage from './BasePage';

class LoginPage extends BasePage {
  page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.usernameInput = this.page.getByLabel('E-mail');
    this.passwordInput = this.page.getByLabel('Password');
    this.loginButton = this.page.getByRole('button', { name: 'Log in' });
  }

  async login(username?: string, password?: string, skipUrlCheck = false) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    if (skipUrlCheck) {
      return;
    }

    await this.page.waitForURL((url) =>
      url.pathname.startsWith('/en/projects'),
    );
  }

  async validateWrongPasswordError({ errorText }: { errorText: string }) {
    await expect(this.page.getByText(errorText)).toBeVisible();
  }
}

export default LoginPage;
