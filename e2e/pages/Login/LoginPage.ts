import { Page } from 'playwright';

class LoginPage {
  page: Page;
  usernameInput = 'input[type="email"]';
  passwordInput = 'input[type="password"]';
  loginButton = 'button[type="submit"].button-native';

  constructor(page: Page) {
    this.page = page;
  }

  async login(username?: string, password?: string) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    await this.page.fill(this.usernameInput, username);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.loginButton);
  }
}

export default LoginPage;
