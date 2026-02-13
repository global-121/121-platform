import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

// KOBO INTEGRATION DETAILS
const koboIntegrationDetails = {
  url: 'http://mock-service:3001/api/kobo',
  successfulAssetId: 'success-asset',
  apiKey: 'mock-token',
};

test.beforeEach(
  async ({ resetDBAndSeedRegistrations, registrationDataPage }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.safaricomProgram,
      registrations: registrationsSafaricom,
      programId: programIdSafaricom,
      navigateToPage: `/en-GB/program/${programIdSafaricom}/settings/registration-data`,
    });
    await registrationDataPage.clickRegistrationDataSection();
  },
);

test('Add Kobo integration successfully', async ({ registrationDataPage }) => {
  await test.step('Add Kobo integration', async () => {
    await registrationDataPage.addKoboToolboxIntegration({
      url: koboIntegrationDetails.url,
      assetId: koboIntegrationDetails.successfulAssetId,
      apiKey: koboIntegrationDetails.apiKey,
    });
    // Validate success message after adding Kobo integration with correct details
    await registrationDataPage.validateKoboIntegrationMessage({
      message: 'Dry run successful - validation passed',
    });
    // click continue button to exit the form
    await registrationDataPage.clickContinueButton();
    // validate toast message after exiting the form
    await registrationDataPage.validateToastMessageAndClose(
      'Kobo form successfully integrated.',
    );
  });
});
