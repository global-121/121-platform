import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import UsersPage from '@121-e2e/portalicious/pages/UsersPage';

const newUSerFullName = 'New User';
const newUserEmail = 'email@example.example';

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

test('[30867] [Admin] Add a user', async ({ page }) => {
  const basePage = new BasePage(page);
  const users = new UsersPage(page);

  await test.step('Add user new user', async () => {
    await basePage.navigateToPage('Users');
    await users.addNewUser({
      fullName: newUSerFullName,
      email: newUserEmail,
    });
    await users.validateNewUserAdded({
      fullName: newUSerFullName,
      email: newUserEmail,
    });
  });
});
