import { test } from '@playwright/test';
import HomePage from '../../../pages/Home/HomePage';
import LoginPage from '../../../pages/Login/LoginPage';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN, process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN);
});

test('should display correct amount of runnig projects', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.validateNumberOfActivePrograms(2);
  await homePage.openPAsForRegistration();
});
