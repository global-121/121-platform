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

test('[29309] Change password successfully', async ({ page }) => {
  const homePage = new HomePage(page);
  const changePasswordPage = new ChangePasswordPage(page);
  const loginPage = new LoginPage(page);

  await test.step('Should display correct amount of running projects and navigate to PA table', async () => {
    await homePage.selectAccountOption('Change password');
  });

  await test.step('Should change password successfully', async () => {
    await changePasswordPage.fillInChangePassword({
      currentPassword: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    await changePasswordPage.submitChangePassword();
    await changePasswordPage.assertChangePasswordSuccessPopUp();
  });

  await test.step('Login with new credentials', async () => {
    await homePage.selectAccountOption('Logout');
    await loginPage.login(
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      'newPassword',
    );
  });

  await test.step('Login with old credentials', async () => {
    await homePage.selectAccountOption('Logout');
    await loginPage.loginTest(
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    );
    await loginPage.validateWrongPasswordError({
      errorText:
        'Invalid email or password. Double-check your credentials and try again.',
    });
  });
});
