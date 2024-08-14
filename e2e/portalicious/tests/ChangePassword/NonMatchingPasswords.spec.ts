import ChangePasswordPage from '@121-e2e/portalicious/pages/ChangePasswordPage';
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

test('[29311] Change password unsuccessfully (Current password incorrect)', async ({
  page,
}) => {
  const homePage = new HomePage(page);
  const changePasswordPage = new ChangePasswordPage(page);

  await test.step('Should navigate to user account dropdown and select change password option', async () => {
    await homePage.selectAccountOption('Change password');
  });

  await test.step('Should type wrong confirm password and recieve error', async () => {
    await changePasswordPage.fillInChangePassword({
      currentPassword: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
      newPassword: 'newPassword',
      confirmPassword: 'newPasswordWrong',
    });
    await changePasswordPage.submitChangePassword();
    await changePasswordPage.validateChangePasswordConfirmPasswordError({
      errorText: 'The confirm password must be equal to the new password.',
    });
  });
});
