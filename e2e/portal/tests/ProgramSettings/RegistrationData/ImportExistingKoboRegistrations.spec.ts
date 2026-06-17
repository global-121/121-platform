import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { koboIntegrationDetails } from './kobo-registration-data';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
  });
});

test('Import existing Kobo registrations after adding Kobo integration', async ({
  registrationDataPage,
}) => {
  await test.step('Add Kobo integration', async () => {
    await registrationDataPage.addKoboIntegration(koboIntegrationDetails);
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
  });

  await test.step('Import existing Kobo registrations', async () => {
    await registrationDataPage.openImportExistingKoboRegistrationsDialog();
    await registrationDataPage.initiateImportButton.click();
  });

  await test.step('Validate success message after importing existing Kobo registrations', async () => {
    await expect(
      registrationDataPage.importDialog.getByText('1 total submission(s)'),
    ).toBeVisible();
    await expect(
      registrationDataPage.importDialog.getByText('Imported successfully: 1'),
    ).toBeVisible();
  });

  await test.step('Skip importing existing Kobo registrations when there are no new registrations to import', async () => {
    await registrationDataPage.closeImportDialog.click();
    await registrationDataPage.openImportExistingKoboRegistrationsDialog();
    await registrationDataPage.initiateImportButton.click();

    await expect(
      registrationDataPage.importDialog.getByText('1 total submission(s)'),
    ).toBeVisible();

    await expect(
      registrationDataPage.importDialog.getByText('Submissions skipped: 1'),
    ).toBeVisible();
  });
});

test('Import existing Kobo registrations immediately after adding Kobo integration', async ({
  registrationDataPage,
}) => {
  await test.step('Add Kobo integration', async () => {
    await registrationDataPage.addKoboIntegration(koboIntegrationDetails);
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      openImportExistingRegistrationsDialog: true,
    });
  });

  await test.step('Import existing Kobo registrations', async () => {
    await registrationDataPage.initiateImportButton.click();
  });

  await test.step('Validate success message after importing existing Kobo registrations', async () => {
    await expect(
      registrationDataPage.importDialog.getByText('1 total submission(s)'),
    ).toBeVisible();
    await expect(
      registrationDataPage.importDialog.getByText('Imported successfully: 1'),
    ).toBeVisible();
  });
});

test('Import existing Kobo registrations that include errors in the registrations', async ({
  registrationDataPage,
}) => {
  await test.step('Re-add Kobo integration with over-limit asset', async () => {
    await registrationDataPage.addKoboIntegration({
      url: `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/import-with-failure/summary`,
      apiKey: 'mock-token',
    });
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
  });

  await test.step('Import existing Kobo registrations', async () => {
    await registrationDataPage.openImportExistingKoboRegistrationsDialog();
    await registrationDataPage.initiateImportButton.click();
  });

  await test.step('validate error message after importing existing Kobo registrations with errors', async () => {
    await expect(
      registrationDataPage.importDialog.getByText('Submissions failed: 1'),
    ).toBeVisible();
    await expect(
      registrationDataPage.importDialog.getByText(
        'Below are the errors corresponding to the failed submissions. Correct the submissions in the kobo form and try again.',
      ),
    ).toBeVisible();
  });

  await test.step('Validate error table with details of the errors in the registrations', async () => {
    await registrationDataPage.validateErrorTable();
  });
});

test('Import error when importing too many existing Kobo registrations', async ({
  registrationDataPage,
}) => {
  await test.step('Re-add Kobo integration with over-limit asset', async () => {
    await registrationDataPage.addKoboIntegration({
      url: `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/asset-id-over-limit/summary`,
      apiKey: 'mock-token',
    });
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
  });

  await test.step('Import existing Kobo registrations', async () => {
    await registrationDataPage.openImportExistingKoboRegistrationsDialog();
    await registrationDataPage.initiateImportButton.click();
  });

  await test.step('Validate error message when importing too many existing Kobo registrations', async () => {
    await registrationDataPage.validateKoboIntegration({
      message:
        'Something went wrong: "The Kobo form has 1001 total submissions, which exceeds the maximum of 1000 that can be fetched at once. Not all submissions could be retrieved, so some new ones may be missing. Please use the CSV import instead and split the data into smaller batches.',
    });
  });
});
