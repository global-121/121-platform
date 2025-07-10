import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import ChangePasswordPage from '@121-e2e/portal/pages/ChangePasswordPage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Change password redirect', async ({ page }) => {
  const changePasswordPage = new ChangePasswordPage(page);

  await test.step('Should bring the user to the Change-Password-page from a well-known URL', async () => {
    await page.goto('/.well-known/change-password');

    await changePasswordPage.changePasswordButton.isVisible();
  });
});
