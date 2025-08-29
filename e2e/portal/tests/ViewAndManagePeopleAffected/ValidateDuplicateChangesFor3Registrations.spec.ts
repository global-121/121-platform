import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationPersonalInformationPage from '@121-e2e/portal/pages/RegistrationPersonalInformationPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const duplicateRegistration = registrationsPV[1]; // 'Jan Janssen'
// making sure we have 3 duplicate registrations
const extraDuplicate = {
  ...duplicateRegistration,
  referenceId: '11111',
  fullName: 'Mr. Extra Duplicate',
};

const seededRegistrations = [...registrationsPV, extraDuplicate];

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    seededRegistrations,
    projectIdPV,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[33879] After the data change of 1 out of 3 duplicates, only 1 registration gets unique badge', async ({
  page,
}) => {
  const homePage = new HomePage(page);
  const registrations = new RegistrationsPage(page);
  const registrationActivityLogPage = new RegistrationActivityLogPage(page);
  const registrationPersonalInformationPage =
    new RegistrationPersonalInformationPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Project (PV)';

  const duplicateRegistration = registrationsPV[1]; // 'Jan Janssen'

  await test.step('Select project', async () => {
    await homePage.selectProject(projectTitle);
  });

  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = seededRegistrations.length;
    await registrations.waitForLoaded(allRegistrationsCount);
  });

  await test.step('Verify we have three duplicate registrations', async () => {
    await registrations.assertDuplicateColumnValues([
      'Unique',
      'Duplicate',
      'Duplicate',
      'Unique',
      'Duplicate',
    ]);
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
    await registrationActivityLogPage.navigateToProjectPage('Registrations');
  });

  await test.step('Verify that we now have 2 duplicate registrations', async () => {
    await registrations.assertDuplicateColumnValues([
      'Unique',
      'Unique',
      'Duplicate',
      'Unique',
      'Duplicate',
    ]);
  });
});
