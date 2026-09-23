import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationOCW1,
  registrationsVisa,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const registrations = [
  ...registrationsVisa,
  {
    ...registrationOCW1,
    referenceId: 'test-reference-id',
  },
];

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
});

test('Block payment creation with duplicates', async ({ paymentsPage }) => {
  const customName = 'My custom payment';

  await paymentsPage
    .createPayment({ name: customName, expectFailure: true })
    .catch(async () => {
      await paymentsPage.validateToastMessageAndClose(
        'One or more of your selected registrations are duplicate. Resolve or remove them to continue.',
      );
    });
});
