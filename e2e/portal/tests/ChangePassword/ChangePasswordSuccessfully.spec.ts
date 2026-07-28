import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import ChangePasswordPage from '@121-e2e/portal/pages/ChangePasswordPage';

test.beforeEach(async ({ loginPage }) => {
  await resetDB({
    seedScript: SeedScript.testMultiple,
  });

  // Login
  await loginPage.login({
    username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
    password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
  });
});

test('Change password successfully', async ({ page, loginPage, basePage }) => {
  const changePasswordPage = new ChangePasswordPage(page);

  await test.step('Should navigate to user account dropdown and select change password option', async () => {
    await basePage.selectAccountOption('Change password');
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
    await basePage.selectAccountOption('Logout');
    await loginPage.login({
      username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      password: 'newPassword',
    });
  });

  await test.step('Login with old credentials', async () => {
    await basePage.selectAccountOption('Logout');
    await loginPage.login({
      username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
      skipUrlCheck: true,
    });
    await loginPage.validateFormError({
      errorText:
        'Invalid email or password. Double-check your credentials and try again.',
    });
  });
});
