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
const koboImageLabel = 'Upload an important photo';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
  });
});

test('User can open Kobo image panel and image is downloaded only when panel opens', async ({
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

  await test.step('Kobo image panel is visible and starts as available', async () => {
    await registrationPersonalInformationPage.validateKoboImageStatus({
      label: koboImageLabel,
      status: 'Available',
    });

    expect(koboImageDownloadRequestCount).toBe(0);
  });

  await test.step('Opening panel triggers a single image download', async () => {
    await Promise.all([
      page.waitForRequest(
        (request) =>
          request.method() === 'GET' &&
          request.url().includes(koboImageDownloadApiPath),
      ),
      registrationPersonalInformationPage.clickKoboImageAccordionHeader({
        label: koboImageLabel,
      }),
    ]);

    await expect(page.locator('app-image-list img').first()).toBeVisible();
    expect(koboImageDownloadRequestCount).toBe(1);
  });

  await test.step('Re-opening panel does not trigger an additional download', async () => {
    await registrationPersonalInformationPage.clickKoboImageAccordionHeader({
      label: koboImageLabel,
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

    await registrationPersonalInformationPage.clickKoboImageAccordionHeader({
      label: koboImageLabel,
    });

    const secondDownloadDetected = await secondDownloadRequestPromise;

    expect(secondDownloadDetected).toBe(false);
    expect(koboImageDownloadRequestCount).toBe(1);
  });
});
