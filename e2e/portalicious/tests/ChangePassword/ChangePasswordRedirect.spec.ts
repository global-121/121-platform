import LoginPage from '@121-e2e/pages/Login/LoginPage';
import ChangePasswordPage from '@121-e2e/portalicious/pages/ChangePasswordPage';
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

test('Change password redirect', async ({ page }) => {
  const changePasswordPage = new ChangePasswordPage(page);

  await test.step('Should bring the user to the Change-Password-page from a well-known URL', async () => {
    await page.goto('/.well-known/change-password');

    await changePasswordPage.changePasswordButton.isVisible();
  });
});
