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
  'fsp',
  'scope',
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
        'fsp',
        'scope',
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

test('Check if scope is not shown when scope is disabled', async ({
  programSettingsPage,
  registrationDataPage,
  page,
}) => {
  await test.step('Disable scope', async () => {
    await programSettingsPage.navigateToProgramPage('Settings');
    await programSettingsPage.clickEditProgramInformationSectionByTitle(
      'Basic information',
    );

    const scopeSwitch = page.getByRole('switch', {
      name: 'Use "scope" in this program',
    });

    if ((await scopeSwitch.getAttribute('aria-checked')) !== 'false') {
      await scopeSwitch.click();
    }

    await programSettingsPage.saveChanges();
    await programSettingsPage.validateToastMessageAndClose(
      'Basic information details saved successfully.',
    );
  });

  await test.step('Validate scope not shown as required field', async () => {
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: [...requiredFieldsFromSeed].filter(
        (field) => field !== 'scope',
      ),
    });
  });
});
