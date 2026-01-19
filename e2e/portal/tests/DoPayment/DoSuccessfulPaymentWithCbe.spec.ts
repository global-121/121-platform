import { format } from 'date-fns';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import CbeProgram from '@121-service/src/seed-data/program/program-cbe.json';
import { waitForPaymentAndTransactionsToComplete } from '@121-service/test/helpers/program.helper';
import {
  programIdCbe,
  registrationsCbe,
} from '@121-service/test/registrations/pagination/pagination-data';

import { test } from '@121-e2e/portal/fixtures/fixture';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

let accessToken: string;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  const result = await resetDBAndSeedRegistrations({
    seedScript: SeedScript.cbeProgram,
    registrations: registrationsCbe,
    programId: programIdCbe,
  });
  accessToken = result.accessToken;
});

test('Do successful payment for Cbe fsp', async ({
  page,
  validatePaymentCard,
}) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const programTitle = CbeProgram.titlePortal.en;
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(programTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdCbe}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.approvePayment();
    await paymentPage.startPayment();

    // Wait for payment transactions to complete
    await waitForPaymentAndTransactionsToComplete({
      programId: programIdCbe,
      paymentReferenceIds: registrationsCbe.map((r) => r.referenceId),
      accessToken,
      maxWaitTimeMs: 40_000,
      completeStatuses: [TransactionStatusEnum.success],
    });
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdCbe}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
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
      currency: CbeProgram.currency,
      programId: programIdCbe,
      scenario: 'successful',
    });
  });
});
