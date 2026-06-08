import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const languagesBeforeIntegration = ['English'];
const languagesAfterIntegration = ['English', 'Dutch'];

const koboIntegrationDetails = {
  url: `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/success-asset/summary`,
  apiKey: 'mock-token',
};

const defaultSafaricomAttributes = [
  { name: 'fullName', label: 'First Name' },
  { name: 'gender', label: 'Gender' },
  { name: 'age', label: 'Age' },
  { name: 'maritalStatus', label: 'Marital status of beneficiary' },
  { name: 'nationalId', label: 'ID number (MPESA)' },
  { name: 'phoneNumber', label: 'Phone Number' },
];

const kobooAttributes = [
  { name: 'What_is_2_2_number', label: 'What is 2+2 (number)?' },
  {
    name: 'How_are_you_today_select_one',
    label: 'How are you today (select one)?',
  },
];

test('View program and kobo attributes in settings page', async ({
  resetDBAndSeedRegistrations,
  registrationDataPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
  });

  await test.step('Validate language tabs', async () => {
    await registrationDataPage.validateLanguageTabs({
      languages: languagesBeforeIntegration,
    });
  });

  await test.step('Add Kobo integration', async () => {
    await registrationDataPage.addKoboIntegration(koboIntegrationDetails);
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
  });

  await test.step('Validate language tabs', async () => {
    await registrationDataPage.validateLanguageTabs({
      languages: languagesAfterIntegration,
    });
  });

  await test.step('Validate default attributes in table', async () => {
    await registrationDataPage.validateProgramAttributesTable({
      attributes: defaultSafaricomAttributes,
    });
  });

  await test.step('Validate kobo attributes in table', async () => {
    await registrationDataPage.validateProgramAttributesTable({
      attributes: kobooAttributes,
    });
  });
});
