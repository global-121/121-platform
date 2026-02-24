import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import KRCSProgram from '@121-service/src/seed-data/program/program-safaricom.json';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  // Full phoneNumber is set to create a failed payment
  registrationsSafaricom[0].phoneNumber = '254000000000';

  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/payments`,
  });
});

test('Do failed payment for Safaricom fsp', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  const numberOfPas = registrationsSafaricom.length;
  const defaultTransferValue = KRCSProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsSafaricom.reduce(
    (output, pa) => {
      return output + pa.paymentAmountMultiplier * defaultTransferValue;
    },
    0,
  );
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(
        `/en-GB/program/${programIdSafaricom}/payments/1`,
      ),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
  });

  await test.step('Validate payment card with failed payment data', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProgramPage('Payments');
    // First try to validate the payment card where system still waits for the response from the PA with Voucher payment method.
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: 0,
      failedTransactions: numberOfPas,
      currency: KRCSProgram.currency,
      programId: programIdSafaricom,
    });
  });
});
