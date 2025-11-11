import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import UsersPage from '@121-e2e/portal/pages/UsersPage';

const newUSerFullName = 'New User';
const newUserEmail = 'email@example.example';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[Admin] Add a user', async ({ page }) => {
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
