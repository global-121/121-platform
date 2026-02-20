import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

// KOBO INTEGRATION DETAILS
const koboIntegrationDetails = {
  url: `${env.MOCK_SERVICE_URL}}/api/kobo`,
  successfulAssetId: 'success-asset',
  apiKey: 'mock-token',
};

const koboIntegrationFormColumns = [
  'National ID number',
  'What is 2+2 (number)?',
  'How are you today (select one)?',
];

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/en-GB/program/${programIdSafaricom}/registrations`,
  });
});

test('Add Kobo integration successfully', async ({
  registrationDataPage,
  registrationsPage,
  tableComponent,
}) => {
  await test.step('Validate column availability from Registrations page', async () => {
    for (const column of koboIntegrationFormColumns) {
      await registrationsPage.checkColumnAvailability({
        column,
        shouldBeAvailable: false,
      });
    }
  });

  await test.step('Navigate to registration data page', async () => {
    await registrationDataPage.navigateToProgramPage('Settings');
  });

  await test.step('Add Kobo integration', async () => {
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.addKoboToolboxIntegration({
      url: koboIntegrationDetails.url,
      assetId: koboIntegrationDetails.successfulAssetId,
      apiKey: koboIntegrationDetails.apiKey,
    });
    // Validate success message after adding Kobo integration with correct details
    await registrationDataPage.validateKoboIntegration({
      koboFormName: '25042025 Prototype Sprint',
    });
    // Click continue button to exit the form
    await registrationDataPage.clickContinueButton();
    // Validate toast message after exiting the form
    await registrationDataPage.validateToastMessageAndClose(
      'Kobo form successfully integrated.',
    );
  });

  await test.step('Validate Kobo integration details on Registrations page', async () => {
    // Navigate to Registrations page
    await registrationsPage.navigateToProgramPage('Registrations');
    // Validate Kobo integration columns are visible in table selection options
    for (const column of koboIntegrationFormColumns) {
      await registrationsPage.checkColumnAvailability({
        column,
        shouldBeAvailable: true,
      });
    }
    // Set Registrations table to display Kobo integration details
    await registrationsPage.configureTableColumns({
      columns: ['Name', ...koboIntegrationFormColumns],
      onlyGivenColumns: false,
    });
    // Validate dropdown values for "How are you today (select one)?" question
    await tableComponent.validateDropdownValuesInTable({
      columnName: 'How are you today (select one)?',
      expectedValues: new Set(['Great', 'Ok', 'Terrible']),
    });
  });
});
