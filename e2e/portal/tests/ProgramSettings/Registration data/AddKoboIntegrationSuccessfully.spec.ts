import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import RegistrationDataPage from '@121-e2e/portal/pages/RegistrationDataPage';

// KOBO INTEGRATION DETAILS
const koboIntegrationDetails = {
  url: 'http://mock-service:3001/api/kobo',
  successfulAssetId: 'success-asset',
  apiKey: 'mock-token',
};

test.beforeEach(async ({ resetDBAndSeedRegistrations, page }) => {
  const registrationData = new RegistrationDataPage(page);
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/en-GB/program/${programIdSafaricom}/settings/registration-data`,
  });
  await registrationData.clickRegistrationDataSection();
});

test('Add Kobo integration successfully', async ({ page }) => {
  const registrationData = new RegistrationDataPage(page);

  await test.step('Add Kobo integration', async () => {
    await registrationData.addKoboToolboxIntegration({
      url: koboIntegrationDetails.url,
      assetId: koboIntegrationDetails.successfulAssetId,
      apiKey: koboIntegrationDetails.apiKey,
    });
    // Validate success message after adding Kobo integration with correct details
    await registrationData.validateKoboIntegrationMessage({
      message: 'Dry run successful - validation passed',
    });
    // click continue button to exit the form
    await registrationData.clickContinueButton();
    // validate toast message after exiting the form
    await registrationData.validateToastMessageAndClose(
      'Kobo form successfully integrated.',
    );
  });
});

test('Add Kobo integration with invalid details and validate error message', async ({
  page,
}) => {
  const registrationData = new RegistrationDataPage(page);

  await test.step('Add Kobo integration un-successfully', async () => {
    await registrationData.addKoboToolboxIntegration({
      url: koboIntegrationDetails.url,
      assetId: koboIntegrationDetails.successfulAssetId,
      apiKey: koboIntegrationDetails.apiKey,
    });
    // Validate error message after adding Kobo integration with details that trigger errors in the mock service
    await registrationData.validateKoboIntegrationMessage({
      message: 'Something went wrong: "Kobo form definition validation failed',
    });
  });
});
