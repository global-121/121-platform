import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('Selection should show correct PA count for bulk action (Single PA)', async ({
  registrationsPage,
}) => {
  await test.step('Apply bulk action on one PA', async () => {
    await registrationsPage.performActionOnRegistrationByName({
      registrationName: 'Gemma Houtenbos',
      action: 'Message',
    });
    await registrationsPage.validateSendMessagePaCount(1);
  });
});
