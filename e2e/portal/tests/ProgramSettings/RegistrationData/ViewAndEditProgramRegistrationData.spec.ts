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

const languagesAfterIntegration = ['English', 'Dutch'];

const defaultSafaricomAttributes = [
  { name: 'fullName', label: 'First Name' },
  { name: 'gender', label: 'Gender' },
  { name: 'age', label: 'Age' },
  { name: 'maritalStatus', label: 'Marital status of beneficiary' },
  { name: 'nationalId', label: 'ID number (MPESA)' },
  { name: 'phoneNumber', label: 'Phone Number' },
];

const labelUpdates = [
  { name: 'What_is_2_2_number', label: 'Updated what is 2+2' },
  {
    name: 'gender',
    label: 'Updated gender',
  },
];

test('View program and edit kobo attributes in settings page', async ({
  resetDBAndSeedRegistrations,
  registrationDataPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
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

  await test.step('Edit attribute labels', async () => {
    await registrationDataPage.editLabels({
      labelUpdates,
    });
  });
});
