import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const fakeReferenceId =
  'this-is-not-the-greatest-reference-id-in-the-world-this-is-just-a-tribute';

test('Wrong CSV should trigger error (wrong data, column name etc.)', async ({
  resetDBAndSeedRegistrations,
  registrationsPage,
}) => {
  await test.step('Setup', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationPV5],
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  await test.step('Select all registrations and open "Update registrations" dialog', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.clickAndSelectImportOption(
      'Update selected registrations',
    );
  });

  await test.step('Download the template, edit it, and upload', async () => {
    await registrationsPage.massUpdateRegistrations({
      expectedRowCount: 1,
      columns: ['Scope', 'Preferred Language', 'Full Name'],
      reason: 'Test reason',
      // remove a comma too many to trigger an error
      transformCSVFunction: (csv) =>
        csv.replace(registrationPV5.referenceId, fakeReferenceId),
    });
  });

  await test.step('Validate import error message', async () => {
    await registrationsPage.validateErrorMessage(
      `Something went wrong: "The following referenceIds were not found in the database: ${fakeReferenceId}"`,
    );
  });
});
