import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

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

test('Change password unsuccessfully (Non-matching passwords)', async ({
  changePasswordPage,
  homePage,
}) => {
  await test.step('Should navigate to user account dropdown and select change password option', async () => {
    await homePage.selectAccountOption('Change password');
  });

  await test.step('Should type wrong current password and receive error', async () => {
    await changePasswordPage.fillInChangePassword({
      currentPassword: `${env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? ''}-with-a-typo`,
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    await changePasswordPage.submitChangePassword();
    await changePasswordPage.validateFormError({
      errorText: 'Something went wrong: "Your password was incorrect."',
    });
  });
});
