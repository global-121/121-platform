import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const fspsToDelete = [FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en].filter(
  (label): label is string => label !== undefined,
);

const fspsToAdd = [FSP_SETTINGS[Fsps.safaricom].defaultLabel.en].filter(
  (label): label is string => label !== undefined,
);

const requiredFieldsFromSeed = [
  'fullName',
  'phoneNumber',
  'whatsappPhoneNumber',
  'addressStreet',
  'addressHouseNumber',
  'addressPostalCode',
  'addressCity',
];

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/settings/registration-data`,
  });
});

test('Check if all required fields are shown prior to integration', async ({
  registrationDataPage,
}) => {
  await test.step('Validate required fields', async () => {
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: requiredFieldsFromSeed,
    });
  });
});

test('Check if all required fields are updated when deleting a FSP', async ({
  registrationDataPage,
  fspSettingsPage,
}) => {
  await test.step('delete FSP', async () => {
    await fspSettingsPage.clickEditFspSection();
    await fspSettingsPage.deleteFsp({
      fspNames: fspsToDelete,
    });
  });

  await test.step('Validate required fields', async () => {
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: [
        'fullName',
        'phoneNumber',
        'whatsappPhoneNumber',
      ],
    });
  });
});

test('Check if all required fields are updated when adding a FSP', async ({
  registrationDataPage,
  fspSettingsPage,
}) => {
  await test.step('add FSP', async () => {
    await fspSettingsPage.clickEditFspSection();
    await fspSettingsPage.addFsp({
      fspNames: fspsToAdd,
    });
  });

  await test.step('Validate required fields', async () => {
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: [...requiredFieldsFromSeed, 'nationalId'],
    });
  });
});
