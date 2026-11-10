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
  'namePartnerOrganization',
  'fullName',
  'phoneNumber',
  'whatsappPhoneNumber',
  'addressStreet',
  'addressHouseNumber',
  'addressHouseNumberAddition',
  'addressPostalCode',
  'addressCity',
];

const allRequiredFspsFromSeed = [
  Fsps.excel,
  Fsps.intersolveVoucherWhatsapp,
  Fsps.intersolveVisa,
  Fsps.intersolveVoucherPaper,
];

test('Check if all required fields are shown prior to integration', async ({
  programSettingsRegistrationDataPage,
}) => {
  await test.step('Validate required fields', async () => {
    await programSettingsRegistrationDataPage.clickRegistrationDataSection();
    await programSettingsRegistrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: allRequiredAttributesFromSeed,
    });
    await programSettingsRegistrationDataPage.validateProgramFspsAreShownInRequiredFieldsTable(
      {
        fsps: [...allRequiredFspsFromSeed],
      },
    );
  });
});

test('Check if all required fields are updated when adding a FSP', async ({
  programSettingsRegistrationDataPage,
  programSettingsPage,
}) => {
  await test.step('add FSP', async () => {
    await programSettingsPage.clickProgramInformation();
    await programSettingsPage.changeFspSelectionForProgram({
      fspNames: fspsToAdd,
    });
  });

  await test.step('Validate required fields', async () => {
    await programSettingsRegistrationDataPage.clickRegistrationDataSection();
    await programSettingsRegistrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: [...allRequiredAttributesFromSeed, 'nationalId'],
    });
  });
});

test('Check if all required fields are updated when deleting a FSP', async ({
  programSettingsRegistrationDataPage,
  programSettingsPage,
}) => {
  await test.step('delete FSP', async () => {
    await programSettingsPage.clickProgramInformation();
    await programSettingsPage.changeFspSelectionForProgram({
      fspNames: fspsToDelete,
    });
  });

  await test.step('Validate required fields', async () => {
    await programSettingsRegistrationDataPage.clickRegistrationDataSection();
    await programSettingsRegistrationDataPage.validateKoboRequiredFieldsTable({
      requiredDataColumnNames: allRequiredAttributesFromSeed,
    });

    await programSettingsRegistrationDataPage.validateProgramFspsAreShownInRequiredFieldsTable(
      {
        fsps: allRequiredFspsFromSeed.filter(
          (fsp) => fsp !== Fsps.intersolveVisa,
        ),
      },
    );
  });
});
