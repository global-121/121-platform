import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NedbankProgram from '@121-service/src/seed-data/program/program-nedbank.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  runCronJobDoNedbankReconciliation,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdNedbank,
  registrationsNedbank,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nedbankProgram, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsNedbank,
    programIdNedbank,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[36080] Do successful payment for Nedbank fsp', async ({ page }) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NedbankProgram.titlePortal.en;
  const numberOfPas = registrationsNedbank.length;
  const defaultTransferValue = NedbankProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsNedbank.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    // Create payment
    await paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdNedbank}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.validateToastMessageAndClose('Payment created.');

    // start payment and validate status chips and badges
    await paymentPage.validatePendingApprovalChip({ isVisible: true });
    await paymentPage.startPayment();
    await paymentPage.validatePendingApprovalChip({ isVisible: false });
    await paymentPage.validateApprovedChipIsPresent();
    await paymentPage.validateToastMessageAndClose(
      'Payment started successfully.',
    );

    // Run CRON job to process payment
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
      successfulTransfers: defaultMaxTransferValue,
      failedTransfers: 0,
      currency: NedbankProgram.currencySymbol,
      projectId: programIdNedbank,
    });
  });
});
