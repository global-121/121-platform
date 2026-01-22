import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import {
  programIdOCW,
  registrationsVisa,
} from '@121-service/test/registrations/pagination/pagination-data';

import { test } from '@121-e2e/portal/fixtures/fixture';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsVisa,
    programId: programIdOCW,
  });
});

test('Do successful payment for Visa fsp', async ({ page }) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const programTitle = NLRCProgram.titlePortal.en;
  const numberOfPas = registrationsVisa.length;
  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsVisa.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(programTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
  });

  await test.step('Validate payment card', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: defaultMaxTransferValue,
      failedTransactions: 0,
      programId: programIdOCW,
    });
  });
});
