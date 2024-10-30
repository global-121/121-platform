import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import UsersPage from '@121-e2e/portalicious/pages/UsersPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.oneAdmin);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[30868] [Admin] Reset users password', async ({ page }) => {
  const basePage = new BasePage(page);
  const users = new UsersPage(page);

  await test.step('Reset password and validate toast message', async () => {
    await basePage.navigateToPage('Users');
    await users.resetUsersPassword(
      process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW!,
    );
    // Assert
    await users.validateToastMessage('Password reset');
  });
});
