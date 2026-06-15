import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import RegistrationDataPage from '@121-e2e/portal/pages/RegistrationDataPage';

// KOBO INTEGRATION DETAILS
const koboIntegrationDetails = {
  url: `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/asset-id-body-that-triggers-errors/summary`,
  apiKey: 'mock-token',
};

test.beforeEach(async ({ resetDBAndSeedRegistrations, page }) => {
  const registrationDataPage = new RegistrationDataPage(page);
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
  });
  await registrationDataPage.clickRegistrationDataSection();
});

test('Add Kobo integration with invalid details and validate error message', async ({
  page,
}) => {
  const registrationDataPage = new RegistrationDataPage(page);

  await test.step('Add Kobo integration un-successfully', async () => {
    await registrationDataPage.addKoboToolboxIntegration({
      url: koboIntegrationDetails.url,
      apiKey: koboIntegrationDetails.apiKey,
    });
  });

  await test.step('Validate error dialog for Kobo integration failure', async () => {
    await registrationDataPage.validateToastMessage(
      'Error while integrating Kobo form',
    );

    await registrationDataPage.validateErrorDialog({
      missingFields: ['phoneNumber', 'nationalId'],
      configurationErrors: [
        'Kobo form must contain the following name attributes defined in program.fullnameNamingConvention. However the following attributes are missing: fullName',
        'Invalid Kobo language code: null. Please use https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes',
      ],
    });
  });
});
