import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import { getFspLabels } from '@121-e2e/portal/helpers/get-fsp-labels';

const fspsToAdd = getFspLabels({
  fsps: [Fsps.safaricom],
});

const fspsToDelete = getFspLabels({
  fsps: [Fsps.intersolveVisa],
});

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    programId: programIdPV,
    registrations: [registrationPV5],
    navigateToPage: `/program/${programIdPV}/settings/registration-data`,
  });
});

const allRequiredAttributesFromSeed = [
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

test('Check if all required fields are shown prior to integration', async ({
  registrationDataPage,
}) => {
  await test.step('Validate required fields', async () => {
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: allRequiredAttributesFromSeed,
    });
  });
});

test('Check if all required fields are updated when adding a FSP', async ({
  registrationDataPage,
  programSettingsPage,
}) => {
  await test.step('add FSP', async () => {
    await programSettingsPage.clickProgramInformation();
    await programSettingsPage.changeFspSelectionForProgram({
      fspNames: fspsToAdd,
    });
  });

  await test.step('Validate required fields', async () => {
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: [...allRequiredAttributesFromSeed, 'nationalId'],
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
      requiredDataColumnNames: [
        ...allRequiredAttributesFromSeed.filter(
          (attribute) => attribute !== 'scope',
        ),
      ],
    });
  });
});

test('Check if all required fields are updated when deleting a FSP', async ({
  registrationDataPage,
  programSettingsPage,
}) => {
  await test.step('delete FSP', async () => {
    await programSettingsPage.clickProgramInformation();
    await programSettingsPage.changeFspSelectionForProgram({
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
