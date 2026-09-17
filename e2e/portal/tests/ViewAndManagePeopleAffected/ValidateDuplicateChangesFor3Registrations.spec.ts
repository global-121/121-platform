import { expect } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPVWithTwoDuplicates,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const duplicateRegistration = registrationsPVWithTwoDuplicates[1]; // 'Jan Janssen'

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedWithStatus: RegistrationStatusEnum.included,
    registrations: registrationsPVWithTwoDuplicates,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('After the data change of 1 out of 3 duplicates, only 1 registration gets unique badge', async ({
  registrationsPage,
  registrationActivityLogPage,
  registrationPersonalInformationPage,
}) => {
  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPVWithTwoDuplicates.length;
    await registrationsPage.waitForLoaded(allRegistrationsCount);
  });

  await test.step('Verify we have three duplicate registrations', async () => {
    await registrationsPage.assertDuplicateColumnValues([
      'Unique',
      'Duplicate',
      'Duplicate',
      'Unique',
      'Duplicate',
    ]);
  });

  await test.step('Open registration page and verify banner is present', async () => {
    await registrationsPage.goToRegistrationByName({
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

  await test.step('Verify that we now have 2 duplicate registrations', async () => {
    await registrationsPage.assertDuplicateColumnValues([
      'Unique',
      'Unique',
      'Duplicate',
      'Unique',
      'Duplicate',
    ]);
  });
});
