import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationsVisa,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsVisa,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
});

test('Create payment with a custom name', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  const customName = 'My custom payment';

  await paymentsPage.createPayment({ name: customName });
  await page.waitForURL((url) =>
    url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
  );
  await paymentPage.validateToastMessageAndClose('Payment created.');
});
