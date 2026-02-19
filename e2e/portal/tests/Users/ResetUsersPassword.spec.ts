import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach('Setup', async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
});

test('[Admin] Reset users password', async ({ usersPage }) => {
  await test.step('Reset password and validate toast message', async () => {
    await usersPage.navigateToPage('Users');
    await usersPage.resetUsersPassword(
      env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
    );
    // Assert
    await usersPage.validateToastMessage('Password reset');
  });
});
