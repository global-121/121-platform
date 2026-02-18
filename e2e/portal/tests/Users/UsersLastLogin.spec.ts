import { format } from 'date-fns';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const date = new Date();
const formattedDate = format(date, 'dd/MM/y,');
const formattedTime = format(date, 'HH:mm');
const loginTimeStamp = `${formattedDate} ${formattedTime}`;

test('[Admin] View last login', async ({
  resetDBAndSeedRegistrations,
  usersPage,
  loginPage,
}) => {
  await test.step('Setup - Login with view user', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.testMultiple,
      skipSeedRegistrations: true,
      username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
    });
  });

  await test.step('Log out and Login with Admin user', async () => {
    // Log out
    await usersPage.selectAccountOption('Logout');
    // Login
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    );
  });

  await test.step('Validate last login', async () => {
    await usersPage.navigateToPage('Users');
    // Assert
    await usersPage.validateRowTextContent({
      email: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      textContent: loginTimeStamp,
    });
  });
});
