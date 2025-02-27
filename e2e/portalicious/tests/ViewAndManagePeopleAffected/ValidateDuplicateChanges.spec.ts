import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portalicious/pages/RegistrationActivityLogPage';
import RegistrationPersonalInformationPage from '@121-e2e/portalicious/pages/RegistrationPersonalInformationPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  const programIdPV = 2;
  await resetDB(SeedScript.nlrcMultiple);

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

test('[33856] After the data change of duplicate registration, both registrations get unique badge', async ({
  page,
}) => {
  const homePage = new HomePage(page);
  const registrations = new RegistrationsPage(page);
  const registrationActivityLogPage = new RegistrationActivityLogPage(page);
  const registrationPersonalInformationPage =
    new RegistrationPersonalInformationPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  const duplicateRegistration = registrationsPV[1]; // 'Jan Janssen'

  await test.step('Select program', async () => {
    await homePage.selectProgram(projectTitle);
  });

  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPV.length;
    await registrations.waitForLoaded(allRegistrationsCount);
  });

  await test.step('Open registration page and verify banner is present', async () => {
    await registrations.goToRegistrationByName({
      registrationName: duplicateRegistration.fullName,
    });

    await expect(registrationActivityLogPage.duplicatesBanner).toBeVisible();
  });

  await test.step('Edit registration to make it unique', async () => {
    await registrationActivityLogPage.goToRegistrationPage(
      'Personal information',
    );

    await registrationPersonalInformationPage.editRegistration({
      field: 'Phone Number',
      value: '11111',
    });

    await registrationPersonalInformationPage.editRegistration({
      field: 'WhatsApp Nr.',
      value: '11111',
    });
  });

  await test.step('Verify banner has disappeared and registration is now unique', async () => {
    await expect(
      registrationActivityLogPage.duplicatesBanner,
    ).not.toBeVisible();

    await registrationActivityLogPage.assertDuplicateStatus({
      status: 'Unique',
    });
  });

  await test.step('Navigate back to registrations table', async () => {
    await registrationActivityLogPage.navigateToProgramPage('Registrations');
  });

  await test.step('Verify all registrations are unique now', async () => {
    await registrations.assertDuplicateColumnValues([
      'Unique',
      'Unique',
      'Unique',
      'Unique',
    ]);
  });
});
