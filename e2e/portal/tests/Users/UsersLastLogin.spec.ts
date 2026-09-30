import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import { generateTimestampsWithGrace } from '@121-e2e/portal/utils';

let loginDate: Date;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  loginDate = new Date();
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
    userCredentials: {
      username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
    },
  });
});

test('[Admin] View last login', async ({ usersPage, loginPage, basePage }) => {
  await test.step('Log out and Login with Admin user', async () => {
    // Log out
    await basePage.selectAccountOption('Logout');
    // Login
    await loginPage.loginAsAdmin();
  });

  await test.step('Validate last login', async () => {
    const candidateTimestamps = generateTimestampsWithGrace({
      startDate: loginDate,
      formatPattern: 'dd/MM/y, HH:mm',
      graceMinutes: 1,
    });

    await usersPage.navigateToPage('Users');
    // Assert
    await usersPage.validateRowTextContent({
      email: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      textContent: candidateTimestamps,
    });
  });
});
