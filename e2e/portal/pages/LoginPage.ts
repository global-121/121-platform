import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import { env } from '@121-service/src/env';

import BasePage from './BasePage';

class LoginPage extends BasePage {
  page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginWithOneTimePasswordButton: Locator;
  readonly sendCodeButton: Locator;
  readonly oneTimePasswordInput: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.usernameInput = this.page.getByLabel('E-mail');
    this.passwordInput = this.page.getByLabel('Password');
    this.loginButton = this.page.getByRole('button', {
      name: 'Log in',
      exact: true,
    });
    this.loginWithOneTimePasswordButton = this.page.getByRole('button', {
      name: 'Log in with a one-time code instead',
    });
    this.sendCodeButton = this.page.getByRole('button', { name: 'Send code' });
    this.oneTimePasswordInput = this.page.locator('p-inputotp input').first();
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
    expectLoginToFail = false,
  }: {
    username: string;
    password: string;
    skipNavigateToLogin?: boolean;
    skipUrlCheck?: boolean;
    expectLoginToFail?: boolean;
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

    if (expectLoginToFail) {
      return;
    }

    if (skipUrlCheck) {
      // Wait until the app leaves the login page, which guarantees the login
      // response was processed and the user was written to localStorage,
      // before callers do a full page.goto() that tears down this page.
      await this.page.waitForURL((url) => !url.pathname.includes('/login'));
      return;
    }

    await this.page.waitForURL((url) =>
      url.pathname.startsWith('/en-GB/programs'),
    );
  }

  async requestOneTimePassword({ email }: { email: string }): Promise<void> {
    await super.goto('/login');
    await this.usernameInput.fill(email);
    await this.loginWithOneTimePasswordButton.click();
    await expect(this.sendCodeButton).toBeVisible();
    await expect(this.usernameInput).toHaveValue(email);
    await this.sendCodeButton.click();
    await expect(this.oneTimePasswordInput).toBeVisible();
  }

  async loginWithOneTimePassword({
    oneTimePassword,
  }: {
    oneTimePassword: string;
  }): Promise<void> {
    await this.oneTimePasswordInput.click();
    await this.page.keyboard.type(oneTimePassword);
    await this.loginButton.click();
    await this.page.waitForURL((url) =>
      url.pathname.startsWith('/en-GB/programs'),
    );
  }

  async validateWrongPasswordError({ errorText }: { errorText: string }) {
    await expect(this.page.getByText(errorText)).toBeVisible();
  }
}

export default LoginPage;
