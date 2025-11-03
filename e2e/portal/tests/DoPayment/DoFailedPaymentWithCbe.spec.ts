import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import CbeProgram from '@121-service/src/seed-data/program/program-cbe.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdCbe,
  registrationsCbe,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.cbeProgram, __filename);
  // Full name is set to 'error' to create a failed payment
  registrationsCbe[0].fullName = 'error';
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsCbe, programIdCbe, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[36101] Do failed payment for Cbe fsp', async ({ page }) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = CbeProgram.titlePortal.en;
  const numberOfPas = registrationsCbe.length;
  const defaultTransferValue = CbeProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsCbe.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    // Create payment
    await paymentsPage.createPayment();
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdCbe}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.validateToastMessageAndClose('Payment created.');

    // start payment
    await paymentPage.startPayment();
    await paymentPage.validateToastMessageAndClose(
      'Payment started successfully.',
    );
  });

  await test.step('Validate payment card with failed payment data', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulTransfers: 0,
      failedTransfers: numberOfPas,
      currency: CbeProgram.currency,
      projectId: programIdCbe,
    });
  });
});
