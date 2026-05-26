import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationOCW1],
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
});

test('Rename payment', async ({ page, paymentPage, paymentsPage }) => {
  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
  });

  await test.step('Rename payment and verify name is updated', async () => {
    const newName = 'Updated payment name';
    await paymentPage.renamePayment(newName);
    await paymentPage.validatePaymentName(newName);
  });
});
