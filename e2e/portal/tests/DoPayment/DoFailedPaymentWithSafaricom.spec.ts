import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import KRCSProgram from '@121-service/src/seed-data/program/program-safaricom.json';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

// Clone to avoid mutating the shared module-level array used by other spec files
const registrations = structuredClone(registrationsSafaricom);
// Full phoneNumber is set to create a failed payment
registrations[0].phoneNumber = '254000000000';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/payments`,
  });
});

test('Do failed payment for Safaricom fsp', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  const numberOfPas = registrations.length;
  const defaultTransferValue = KRCSProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrations.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(
        `/en-GB/program/${programIdSafaricom}/payments/1`,
      ),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentDetailsPageTitle();
    await paymentPage.approvePayment();
    await paymentPage.validateToastMessageAndClose('Payment approved');
    await paymentPage.startPayment();
    await paymentPage.validateToastMessageAndClose('Payment started');
  });

  await test.step('Validate payment card with failed payment data', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProgramPage('Payments');
    // First try to validate the payment card where system still waits for the response from the PA with Voucher payment method.
    await paymentsPage.validatePaymentCard({
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: 0,
      failedTransactions: numberOfPas,
      currency: KRCSProgram.currency,
      programId: programIdSafaricom,
    });
  });
});
