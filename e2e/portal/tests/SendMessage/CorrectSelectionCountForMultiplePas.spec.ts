import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('Selection should show correct PA count for bulk action (Multiple PAs)', async ({
  resetDBAndSeedRegistrations,
  registrationsPage,
}) => {
  await test.step('Setup', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  await test.step('Apply bulk action on multiple PAs', async () => {
    // Select on to trigger the first count of bulk action
    await registrationsPage.performActionOnRegistrationByName({
      registrationName: 'Gemma Houtenbos',
      action: 'Message',
    });
    await registrationsPage.validateSendMessagePaCount(1);
    await registrationsPage.cancelSendMessageBulkAction();
    // Select couple of PAs to trigger the second count of bulk action
    await registrationsPage.selectMultipleRegistrations(2);
    await registrationsPage.performActionWithRightClick('Message');
    await registrationsPage.validateSendMessagePaCount(2);
  });
});
