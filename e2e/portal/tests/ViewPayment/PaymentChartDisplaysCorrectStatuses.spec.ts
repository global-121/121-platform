import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDuplicateRegistrations } from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW6Fail,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationOCW1, registrationOCW6Fail],
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });

  await resetDuplicateRegistrations(4);
});

test('Payment chart should reflect transaction statuses', async ({
  paymentPage,
  paymentsPage,
  page,
}) => {
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Chart displays all correct payment statuses', async () => {
    await page.goto(`/en-GB/program/${programIdOCW}/payments/1`);
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.validateGraphStatus({
      approved: 0,
      processing: 0,
      successful: 16,
      failed: 16,
    });
  });
});
