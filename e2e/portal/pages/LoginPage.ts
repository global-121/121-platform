import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import { env } from '@121-service/src/env';

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

  async loginAsAdmin({
    skipNavigateToLogin = false,
    skipUrlCheck = false,
  }: {
    skipNavigateToLogin?: boolean;
    skipUrlCheck?: boolean;
  } = {}): Promise<void> {
    await this.login({
      username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
      skipNavigateToLogin,
      skipUrlCheck,
    });
  }

  async login({
    username,
    password,
    skipNavigateToLogin = false,
    skipUrlCheck = false,
  }: {
    username: string;
    password: string;
    skipNavigateToLogin?: boolean;
    skipUrlCheck?: boolean;
  }): Promise<void> {
    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    if (!skipNavigateToLogin) {
      await super.goto('/login');
    }

    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    if (skipUrlCheck) {
      return;
    }

    await this.page.waitForURL((url) =>
      url.pathname.startsWith('/en-GB/programs'),
    );
  }

  async validateWrongPasswordError({ errorText }: { errorText: string }) {
    await expect(this.page.getByText(errorText)).toBeVisible();
  }
}

export default LoginPage;
