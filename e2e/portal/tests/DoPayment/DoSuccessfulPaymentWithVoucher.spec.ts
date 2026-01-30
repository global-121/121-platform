import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import {
  programIdPV,
  registrationsVoucher,
} from '@121-service/test/registrations/pagination/pagination-data';

import { test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsVoucher,
    programId: programIdPV,
    navigateToPage: `/en-GB/program/${programIdPV}/payments`,
  });
});

test('Do successful payment for Voucher fsp', async ({
  page,
  paymentSetup,
}) => {
  const numberOfPas = registrationsVoucher.length;
  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsVoucher.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Do payment', async () => {
    await paymentSetup.paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdPV}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentSetup.paymentPage.validatePaymentsDetailsPageByDate(
      lastPaymentDate,
    );
    // also validate toast messages for just this 1 (random) FSP instead of for all
    await paymentSetup.paymentPage.validateToastMessageAndClose(
      'Payment created',
    );
    await paymentSetup.paymentPage.approvePayment();
    await paymentSetup.paymentPage.validateToastMessageAndClose(
      'Payment approved',
    );
    await paymentSetup.paymentPage.startPayment();
    await paymentSetup.paymentPage.validateToastMessageAndClose(
      'Payment started',
    );
  });

  await test.step('Validate payment card', async () => {
    await page.waitForTimeout(1000);
    await paymentSetup.paymentPage.waitForPaymentToComplete();
    await paymentSetup.paymentPage.navigateToProgramPage('Payments');
    await paymentSetup.paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: defaultMaxTransferValue,
      failedTransactions: 0,
      programId: programIdPV,
    });
  });
});
