import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NedbankProject from '@121-service/src/seed-data/project/project-nedbank.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  runCronJobDoNedbankReconciliation,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdNedbank,
  registrationsNedbank,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nedbankProject, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsNedbank,
    projectIdNedbank,
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
  const projectTitle = NedbankProject.titlePortal.en;
  const numberOfPas = registrationsNedbank.length;
  const defaultTransferValue = NedbankProject.fixedTransferValue;
  const defaultMaxTransferValue = registrationsNedbank.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Project payments', async () => {
    await paymentsPage.selectProject(projectTitle);

    await paymentsPage.navigateToProjectPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.startPayment();
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${projectIdNedbank}/payments/1`),
    );
    // Run CRON job to process payment
    await runCronJobDoNedbankReconciliation();
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate payment card', async () => {
    await paymentPage.validateToastMessageAndClose('Payment created.');
    // In case of Nedbank, we need to wait for the payment to be processed
    // before we can validate the payment card
    // This way we can avoid reloading the page
    await page.waitForTimeout(1000);
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProjectPage('Payments');
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulTransfers: defaultMaxTransferValue,
      failedTransfers: 0,
      currency: NedbankProject.currencySymbol,
    });
  });
});
