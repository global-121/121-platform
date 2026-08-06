import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const duplicationFieldsBeforeEditing = ['ID number (MPESA)'];
const newDuplicationFields = ['First Name', 'Phone Number'];

test('View and edit duplication fields', async ({
  resetDBAndSeedRegistrations,
  programSettingsRegistrationDataPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
  });

  await test.step('View duplication fields', async () => {
    await programSettingsRegistrationDataPage.validateDeduplicationCardDatalist(
      { visible: true, duplicationFields: duplicationFieldsBeforeEditing },
    );
  });

  await test.step('Edit duplication fields', async () => {
    await programSettingsRegistrationDataPage.editDuplicationFields({
      newDuplicationFields,
    });

    const expectedDuplicationFieldsAfterEditing = [
      ...duplicationFieldsBeforeEditing,
      ...newDuplicationFields,
    ];

    await programSettingsRegistrationDataPage.validateDeduplicationCardDatalist(
      {
        visible: true,
        duplicationFields: expectedDuplicationFieldsAfterEditing,
      },
    );
  });
});
