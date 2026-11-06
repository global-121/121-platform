import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import {
  deleteAllEmails,
  waitForEmail,
} from '@121-e2e/portal/helpers/mailpit.helper';

const userEmail = env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '';

test.beforeEach('Setup', async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
  await deleteAllEmails();
});

test('[Admin] Reset users password', async ({ usersPage }) => {
  await test.step('Reset password and validate toast message', async () => {
    await usersPage.navigateToPage('Users');
    await usersPage.resetUsersPassword(userEmail);
    // Assert
    await usersPage.validateToastMessageAndClose('Password reset');
  });

  await test.step('Validate password reset email is received', async () => {
    const email = await waitForEmail({
      recipient: userEmail,
      subject: '121 Portal password reset',
    });
    // Assert
    expect(email.HTML).toContain(`Username: ${userEmail}`);
  });
});
