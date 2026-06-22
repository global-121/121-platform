import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

// KOBO INTEGRATION DETAILS
const koboIntegrationDetails = {
  url: `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/asset-id-body-that-triggers-errors/summary`,
  apiKey: 'mock-token',
};

test.beforeEach(
  async ({ resetDBAndSeedRegistrations, registrationDataPage }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.safaricomProgram,
      registrations: registrationsSafaricom,
      programId: programIdSafaricom,
      navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
    });
    await registrationDataPage.clickRegistrationDataSection();
  },
);

test('Add Kobo integration with invalid details and validate error message', async ({
  registrationDataPage,
}) => {
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

    await registrationDataPage.validateErrorDialogIsShown();

    await registrationDataPage.validateMissingFields({
      missingFields: ['phoneNumber', 'nationalId'],
    });

    await registrationDataPage.validateFormSettingError({
      formSettingError:
        "Invalid language code: 'null', use a valid ISO 639 language code.",
    });

    await registrationDataPage.validateKoboConfigurationErrorsTable({
      configurationErrorsTableColumns: ['Field', 'Error', 'Solution'],
      configurationErrors: [
        'fullName',
        "Attribute 'fullName' is missing",
        'Add the missing attribute to the Kobo form',
      ],
    });
  });
});
