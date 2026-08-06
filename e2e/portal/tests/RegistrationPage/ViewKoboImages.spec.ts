import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getRegistrationIdByReferenceId } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { koboIntegrationDetails } from '../ProgramSettings/RegistrationData/kobo-registration-data';

const assetIdFromKoboUrl =
  /\/forms\/([^/]+)\/summary/.exec(koboIntegrationDetails.url)?.[1] ??
  'success-asset';

const importedRegistrationReferenceId = `success-${assetIdFromKoboUrl}`;
const koboImageAttributeName = 'photo';
const koboImageOneLabel = 'Upload an important photo';
const koboImageTwoLabel = 'Upload your ID document';
const koboImageThreeLabel = "Upload your driver's license";

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
  });
});

test('User can open Kobo images modals', async ({
  page,
  registrationDataPage,
  registrationPersonalInformationPage,
}) => {
  await test.step('Add Kobo integration and import existing Kobo registrations', async () => {
    await registrationDataPage.addKoboIntegration(koboIntegrationDetails);
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });

    await registrationDataPage.openImportExistingKoboRegistrationsDialog();
    await registrationDataPage.initiateImportButton.click();

    await expect(
      registrationDataPage.importDialog.getByText('Imported successfully: 1'),
    ).toBeVisible();

    await registrationDataPage.closeImportDialog.click();
  });

  const accessToken = await getAccessToken();
  const registrationId = await getRegistrationIdByReferenceId({
    programId: programIdSafaricom,
    referenceId: importedRegistrationReferenceId,
    accessToken,
  });

  const koboImageDownloadApiPath = `/api/programs/${programIdSafaricom}/registrations/${importedRegistrationReferenceId}/kobo-images/${koboImageAttributeName}`;
  let koboImageDownloadRequestCount = 0;

  page.on('request', (request) => {
    if (
      request.method() === 'GET' &&
      request.url().includes(koboImageDownloadApiPath)
    ) {
      koboImageDownloadRequestCount += 1;
    }
  });

  await registrationPersonalInformationPage.goto(
    `/program/${programIdSafaricom}/registrations/${registrationId}/personal-information`,
  );

  await test.step('Kobo image trigger is visible and starts as available', async () => {
    await registrationPersonalInformationPage.validateKoboImageStatus({
      label: koboImageOneLabel,
      status: 'Available',
    });

    expect(koboImageDownloadRequestCount).toBe(0);
  });

  await test.step('Opening modal triggers a single image download', async () => {
    await Promise.all([
      page.waitForRequest(
        (request) =>
          request.method() === 'GET' &&
          request.url().includes(koboImageDownloadApiPath),
      ),
      registrationPersonalInformationPage.toggleKoboImageDialog({
        label: koboImageOneLabel,
      }),
    ]);

    await expect(
      registrationPersonalInformationPage.imageViewerDialog.getByText(
        koboImageOneLabel,
      ),
    ).toBeVisible();
    await expect(
      registrationPersonalInformationPage.imageViewerDialog
        .locator('app-image-viewer img')
        .first(),
    ).toBeVisible();
    expect(koboImageDownloadRequestCount).toBe(1);
  });

  await test.step('Re-opening modal does not trigger an additional download', async () => {
    await registrationPersonalInformationPage.toggleKoboImageDialog({
      label: koboImageOneLabel,
    });

    const secondDownloadRequestPromise = page
      .waitForRequest(
        (request) =>
          request.method() === 'GET' &&
          request.url().includes(koboImageDownloadApiPath),
        { timeout: 1_500 },
      )
      .then(() => true)
      .catch(() => false);

    await registrationPersonalInformationPage.toggleKoboImageDialog({
      label: koboImageOneLabel,
    });

    const secondDownloadDetected = await secondDownloadRequestPromise;

    expect(secondDownloadDetected).toBe(false);
    expect(koboImageDownloadRequestCount).toBe(1);
  });

  await test.step('Should be able to open multiple kobo image modals', async () => {
    await registrationPersonalInformationPage.toggleKoboImageDialog({
      label: koboImageTwoLabel,
    });

    await expect(
      registrationPersonalInformationPage.imageViewerDialog.getByText(
        koboImageTwoLabel,
      ),
    ).toBeVisible();
  });

  await test.step('Kobo image trigger is not visible when Not available', async () => {
    await registrationPersonalInformationPage.validateKoboImageStatus({
      label: koboImageThreeLabel,
      status: 'Not available',
    });
  });
});
