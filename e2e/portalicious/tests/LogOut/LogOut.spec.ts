import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.test);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('Log Out via Menu', async ({ page }) => {
  const homePage = new HomePage(page);
  const loginPage = new LoginPage(page);

  await test.step('Should navigate to user account dropdown and select Log-out option', async () => {
    await homePage.selectAccountOption('Logout');

    await loginPage.loginButton.isVisible();
  });
});

test('Log Out via manual log-out URL', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await test.step('Should navigate to manual logout URL', async () => {
    await page.goto('/logout');

    await loginPage.loginButton.isVisible();

    // Try to access a protected page
    await page.goto('/en/projects');

    await loginPage.loginButton.isVisible();
  });
});
