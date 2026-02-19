import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('After the data change of duplicate registration, both registrations get unique badge', async ({
  registrationsPage,
  registrationActivityLogPage,
  registrationPersonalInformationPage,
}) => {
  const duplicateRegistration = registrationsPV[1]; // 'Jan Janssen'

  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPV.length;
    await registrationsPage.waitForLoaded(allRegistrationsCount);
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

  await test.step('Verify all registrations are unique now', async () => {
    await registrationsPage.assertDuplicateColumnValues([
      'Unique',
      'Unique',
      'Unique',
      'Unique',
    ]);
  });
});
