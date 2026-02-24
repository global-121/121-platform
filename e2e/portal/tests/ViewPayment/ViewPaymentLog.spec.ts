import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const note = 'test payment note';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationOCW1],
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
});

test('View payment log, including note added to payment', async ({
  paymentPage,
  paymentsPage,
  page,
}) => {
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Do payment with note', async () => {
    await paymentsPage.createPayment({ note });
    const paymentId = 1; // First payment in this context, so ID 1
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(
        `/en-GB/program/${programIdOCW}/payments/${paymentId}`,
      ),
    );
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate payment log, including note', async () => {
    await paymentPage.validatePaymentLog(note);
  });
});
