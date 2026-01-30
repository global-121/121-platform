import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import KRCSProgram from '@121-service/src/seed-data/program/program-safaricom.json';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/en-GB/program/${programIdSafaricom}/payments`,
  });
});

test('Do successful payment for Safaricom fsp', async ({
  page,
  paymentSetup,
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
    await paymentSetup.paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(
        `/en-GB/program/${programIdSafaricom}/payments/1`,
      ),
    );
    // Assert payment overview page by payment date/ title
    await paymentSetup.paymentPage.validatePaymentsDetailsPageByDate(
      lastPaymentDate,
    );
    await paymentSetup.paymentPage.approvePayment();
    await paymentSetup.paymentPage.startPayment();
  });

  await test.step('Validate payment card', async () => {
    await paymentSetup.paymentPage.waitForPaymentToComplete();
    await paymentSetup.paymentPage.navigateToProgramPage('Payments');
    await paymentSetup.paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: defaultMaxTransferValue,
      failedTransactions: 0,
      currency: KRCSProgram.currency,
      programId: programIdSafaricom,
    });
  });
});
