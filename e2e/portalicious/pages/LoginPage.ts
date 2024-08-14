import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

class LoginPage {
  page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly wrongPasswordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = this.page.getByLabel('E-mail');
    this.passwordInput = this.page.getByLabel('Password');
    this.loginButton = this.page.getByRole('button', { name: 'Log in' });
    this.wrongPasswordError = this.page.getByTestId('change-password-error');
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

  async loginTest(username?: string, password?: string) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async validateWrongPasswordError({ errorText }: { errorText: string }) {
    await this.page.waitForLoadState('networkidle');
    await this.wrongPasswordError.waitFor();

    const errorString = await this.wrongPasswordError.textContent();
    expect(errorString).toContain(errorText);
  }
}

export default LoginPage;
