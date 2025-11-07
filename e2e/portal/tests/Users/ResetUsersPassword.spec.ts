import { test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import UsersPage from '@121-e2e/portal/pages/UsersPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[Admin] Reset users password', async ({ page }) => {
  const basePage = new BasePage(page);
  const users = new UsersPage(page);

  await test.step('Reset password and validate toast message', async () => {
    await basePage.navigateToPage('Users');
    await users.resetUsersPassword(
      env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
    );
    // Assert
    await users.validateToastMessage('Password reset');
  });
});
