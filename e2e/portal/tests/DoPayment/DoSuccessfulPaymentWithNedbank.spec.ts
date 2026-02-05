import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NedbankProgram from '@121-service/src/seed-data/program/program-nedbank.json';
import { runCronJobDoNedbankReconciliation } from '@121-service/test/helpers/utility.helper';
import {
  programIdNedbank,
  registrationsNedbank,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nedbankProgram,
    registrations: registrationsNedbank,
    programId: programIdNedbank,
    navigateToPage: `/en-GB/program/${programIdNedbank}/payments`,
  });
});

test('Do successful payment for Nedbank fsp', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  const numberOfPas = registrationsNedbank.length;
  const defaultTransferValue = NedbankProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsNedbank.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdNedbank}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.approvePayment();
    await paymentPage.startPayment();

    // Run CRON job to process payment
    await page.waitForTimeout(500); // wait a bit to allow the payment to start before running the CRON job
    await runCronJobDoNedbankReconciliation();
  });

  await test.step('Validate payment card', async () => {
    // In case of Nedbank, we need to wait for the payment to be processed
    // before we can validate the payment card
    // This way we can avoid reloading the page
    await page.waitForTimeout(1000);
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: defaultMaxTransferValue,
      failedTransactions: 0,
      currency: NedbankProgram.currencySymbol,
      programId: programIdNedbank,
    });
  });
});
