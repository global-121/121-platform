import { test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import ChangePasswordPage from '@121-e2e/portal/pages/ChangePasswordPage';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
    env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
  );
});

test('Change password successfully', async ({ page }) => {
  const homePage = new HomePage(page);
  const changePasswordPage = new ChangePasswordPage(page);
  const loginPage = new LoginPage(page);

  await test.step('Should navigate to user account dropdown and select change password option', async () => {
    await homePage.selectAccountOption('Change password');
  });

  await test.step('Should change password successfully', async () => {
    await changePasswordPage.fillInChangePassword({
      currentPassword: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    await changePasswordPage.submitChangePassword();
    await changePasswordPage.assertChangePasswordSuccessPopUp();
  });

  await test.step('Login with new credentials', async () => {
    await homePage.selectAccountOption('Logout');
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      'newPassword',
    );
  });

  await test.step('Login with old credentials', async () => {
    await homePage.selectAccountOption('Logout');
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
      true,
    );
    await loginPage.validateFormError({
      errorText:
        'Invalid email or password. Double-check your credentials and try again.',
    });
  });
});
