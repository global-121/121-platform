import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[33854] Validate that duplicate badges are present in the UI', async ({
  page,
}) => {
  const homePage = new HomePage(page);
  const registrations = new RegistrationsPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Select program', async () => {
    await homePage.selectProgram(projectTitle);
  });

  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPV.length;
    await registrations.waitForLoaded(allRegistrationsCount);
  });

  await test.step('Verify contents of duplicate column', async () => {
    await registrations.assertDuplicateColumnValues([
      'Unique',
      'Duplicate',
      'Duplicate',
      'Unique',
    ]);
  });
});
