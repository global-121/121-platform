import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import CbeProgram from '@121-service/src/seed-data/program/program-cbe.json';
import {
  programIdCbe,
  registrationsCbe,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const registrationsCbeWithError = registrationsCbe.map((registration) => ({
  ...registration,
  fullName: 'error', // Full name is set to 'error' to create a failed payment
}));

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.cbeProgram,
    registrations: registrationsCbeWithError,
    programId: programIdCbe,
    navigateToPage: `/program/${programIdCbe}/payments`,
  });
});

test('Do failed payment for Cbe fsp', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  const numberOfPas = registrationsCbe.length;
  const defaultTransferValue = CbeProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsCbe.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdCbe}/payments/1`),
    );
    await paymentPage.validatePaymentDetailsPageTitle();
    await paymentPage.validateToastMessageAndClose('Payment created.');
    await paymentPage.approvePayment();
    await paymentPage.validateToastMessageAndClose('Payment approved');
    await paymentPage.startPayment();
    await paymentPage.validateToastMessageAndClose('Payment started');
  });

  await test.step('Validate payment card with failed payment data', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validatePaymentCard({
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: 0,
      failedTransactions: numberOfPas,
      currency: CbeProgram.currency,
      programId: programIdCbe,
    });
  });
});
