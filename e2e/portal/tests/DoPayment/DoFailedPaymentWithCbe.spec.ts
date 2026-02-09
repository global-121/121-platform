import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import CbeProgram from '@121-service/src/seed-data/program/program-cbe.json';
import {
  programIdCbe,
  registrationsCbe,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  // Full name is set to 'error' to create a failed payment
  registrationsCbe[0].fullName = 'error';

  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.cbeProgram,
    registrations: registrationsCbe,
    programId: programIdCbe,
    navigateToPage: `/en-GB/program/${programIdCbe}/payments`,
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
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdCbe}/payments/1`),
    );
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.validateToastMessageAndClose('Payment created.');
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
  });

  await test.step('Validate payment card with failed payment data', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: 0,
      failedTransactions: numberOfPas,
      currency: CbeProgram.currency,
      programId: programIdCbe,
    });
  });
});
