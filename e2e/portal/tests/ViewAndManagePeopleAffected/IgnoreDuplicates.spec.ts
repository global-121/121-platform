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

test('Ignore duplicates', async ({
  registrationsPage,
  registrationActivityLogPage,
}) => {
  const duplicateRegistrationA = registrationsPV[1]; // 'Jan Janssen'
  const duplicateRegistrationB = registrationsPV[2]; // 'Joost Herlembach'

  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPV.length;
    await registrationsPage.waitForLoaded(allRegistrationsCount);
  });

  await test.step('Open registration page', async () => {
    await registrationsPage.goToRegistrationByName({
      registrationName: duplicateRegistrationA.fullName,
    });
  });

  await test.step('View banner with duplicate', async () => {
    await registrationActivityLogPage.assertDuplicateWith({
      duplicateName: duplicateRegistrationB.fullName,
    });
  });

  await test.step('Ignore duplication', async () => {
    await registrationActivityLogPage.initiateAction('Ignore duplication');

    const dialog = registrationActivityLogPage.dialog;

    await expect(dialog.getByText('Ignore duplication')).toBeVisible();

    const editInformationReasonField = dialog.getByLabel(
      'Write a reason for the update',
    );
    await editInformationReasonField.fill('E2E test');
    await dialog.getByRole('button', { name: 'Approve' }).click();
  });

  await test.step('Verify no banner is displayed for unique registration', async () => {
    await expect(
      registrationActivityLogPage.duplicatesBanner,
    ).not.toBeVisible();

    await registrationActivityLogPage.assertDuplicateStatus({
      status: 'Unique',
    });
  });
});
