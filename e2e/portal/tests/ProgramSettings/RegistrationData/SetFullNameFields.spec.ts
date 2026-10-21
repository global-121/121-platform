import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { patchProgram } from '@121-service/test/helpers/program.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const programId = 1;

// The Onafriq program has the text attributes 'First Name' and 'Last Name', in that order
const nameFieldsInSelectionOrder = ['Last Name', 'First Name'];

test('Set the full name fields in the order they are selected', async ({
  page,
  programSettingsRegistrationDataPage,
  resetDBAndSeedRegistrations,
}) => {
  await test.step('Seed a program without a full name set up', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.onafriqProgram,
      skipSeedRegistrations: true,
    });
    const accessToken = await getAccessToken();
    await patchProgram(
      programId,
      { fullnameNamingConvention: [] },
      accessToken,
    );
  });

  await test.step('Go to the registration data settings page', async () => {
    await programSettingsRegistrationDataPage.goto(
      `/program/${programId}/settings/registration-data`,
    );
  });

  await test.step('View the full name set up without name fields', async () => {
    await programSettingsRegistrationDataPage.validateFullNameCardNoFieldSelected();
  });

  await test.step('Select the name fields in the opposite order of the attributes', async () => {
    await programSettingsRegistrationDataPage.editFullNameFields({
      nameFields: nameFieldsInSelectionOrder,
    });

    await programSettingsRegistrationDataPage.validateToastMessageAndClose(
      'Full name saved successfully.',
    );
    await programSettingsRegistrationDataPage.validateFullNameCardFields({
      nameFields: nameFieldsInSelectionOrder,
    });
  });

  await test.step('Keep the order after reloading the page', async () => {
    await page.reload();

    await programSettingsRegistrationDataPage.validateFullNameCardFields({
      nameFields: nameFieldsInSelectionOrder,
    });
  });
});
