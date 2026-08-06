import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import {
  koboIntegrationDetails,
  kobooAttributes,
} from './kobo-registration-data';

const koboIntegrationFormColumns = [
  'What is 2+2 (number)?',
  'How are you today (select one)?',
];

test('Add Kobo integration successfully', async ({
  resetDBAndSeedRegistrations,
  programSettingsRegistrationDataPage,
  registrationsPage,
  tableComponent,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/registrations`,
  });

  await test.step('Validate column availability from Registrations page', async () => {
    for (const column of koboIntegrationFormColumns) {
      await registrationsPage.checkColumnAvailability({
        column,
        shouldBeAvailable: false,
      });
    }
  });

  await test.step('Navigate to registration data page', async () => {
    await programSettingsRegistrationDataPage.navigateToProgramPage('Settings');
  });

  await test.step('Add Kobo integration', async () => {
    await programSettingsRegistrationDataPage.addKoboIntegration(
      koboIntegrationDetails,
    );
    await programSettingsRegistrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
    await programSettingsRegistrationDataPage.validateKoboRequiredFieldsTableNotVisible();
    await programSettingsRegistrationDataPage.validateProgramAttributesTable({
      attributes: kobooAttributes,
    });
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
