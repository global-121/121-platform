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
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nedbankProgram);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsNedbank,
    programIdNedbank,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[36080] Do successful payment for Nedbank fsp', async ({ page }) => {
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
    await paymentsPage.createPayment();
    await paymentsPage.startPayment();
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdNedbank}/payments/1`),
    );
    // Run CRON job to process payment
    await runCronJobDoNedbankReconciliation();
    // Assert payment overview page by payment date/ title
    await paymentsPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate payment card', async () => {
    // In case of Nedbank, we need to wait for the payment to be processed
    // before we can validate the payment card
    // Therefore it is better not to close the toast message immediately
    // This way we can avoid reloading the page
    await paymentsPage.validateToastMessageWithTimeout(
      'Payment created.',
      1000,
    );
    await paymentsPage.navigateToProgramPage('Payments');
    await paymentsPage.waitForPaymentToComplete();
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulTransfers: defaultMaxTransferValue,
      failedTransfers: 0,
      currency: NedbankProgram.currencySymbol,
    });
  });
});
