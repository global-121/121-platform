import { type Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import ChangePasswordPage from '@121-e2e/portal/pages/ChangePasswordPage';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.describe('Test change password functionality', () => {
  let password = env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await resetDB(SeedScript.testMultiple, __filename);

    // Login
    const loginPage = new LoginPage(page);
    await page.goto('/');
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      password ?? '',
    );
  });

  test.afterEach(async () => {
    await page.goto('/');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Change password redirect', async () => {
    const changePasswordPage = new ChangePasswordPage(page);

    await test.step('Should bring the user to the Change-Password-page from a well-known URL', async () => {
      await page.goto('/.well-known/change-password');

      await changePasswordPage.changePasswordButton.isVisible();
    });
  });

  test('[29310] Change password unsuccessfully (Non-matching passwords)', async () => {
    const homePage = new HomePage(page);
    const changePasswordPage = new ChangePasswordPage(page);

    await test.step('Should navigate to user account dropdown and select change password option', async () => {
      await homePage.selectAccountOption('Change password');
    });

    await test.step('Should type wrong current password and recieve error', async () => {
      await changePasswordPage.fillInChangePassword({
        currentPassword: `${password ?? ''}-with-a-typo`,
        newPassword: 'newPassword',
        confirmPassword: 'newPassword',
      });
      await changePasswordPage.submitChangePassword();
      await changePasswordPage.validateFormError({
        errorText: 'Something went wrong: Your password was incorrect.',
      });
    });
  });

  test('[29309] Change password successfully', async () => {
    const homePage = new HomePage(page);
    const changePasswordPage = new ChangePasswordPage(page);
    const loginPage = new LoginPage(page);

    await test.step('Should navigate to user account dropdown and select change password option', async () => {
      await homePage.selectAccountOption('Change password');
    });

    await test.step('Should change password successfully', async () => {
      password = 'newPassword'; // Update password variable to new value
      await changePasswordPage.fillInChangePassword({
        currentPassword: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
        newPassword: password,
        confirmPassword: password,
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

    await test.step('Login with new credentials', async () => {
      await loginPage.login(
        env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
        'newPassword',
      );
    });
  });

  test('[29311] Change password unsuccessfully (Current password incorrect)', async () => {
    const homePage = new HomePage(page);
    const changePasswordPage = new ChangePasswordPage(page);

    await test.step('Should navigate to user account dropdown and select change password option', async () => {
      await homePage.selectAccountOption('Change password');
    });

    await test.step('Should type wrong confirm password and recieve error', async () => {
      await changePasswordPage.fillInChangePassword({
        currentPassword: password,
        newPassword: `${password}-new`,
        confirmPassword: 'newPasswordWrong',
      });
      await changePasswordPage.submitChangePassword();
      await changePasswordPage.validateFormError({
        errorText: 'The confirm password must be equal to the new password.',
      });
    });
  });
});
