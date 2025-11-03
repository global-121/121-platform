import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import {
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW6Fail,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [...registrationsOCW, registrationOCW6Fail],
    programIdOCW,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[32300] Retry failed transfers', async ({ page }) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NLRCProgram.titlePortal.en;
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;
  const paymentPageUrl = `/en-GB/project/${programIdOCW}/payments/1`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment();
    await page.waitForURL((url) => url.pathname.startsWith(paymentPageUrl));
    await paymentPage.startPayment();

    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Check presence of retry button', async () => {
    await paymentPage.waitForPaymentToComplete();
    await page.goto(paymentPageUrl, {
      waitUntil: 'networkidle',
    });
    await paymentPage.validateRetryFailedTransfersButtonToBeVisible();
  });

  await test.step('Retry payment with correct PA values', async () => {
    const accessToken = await getAccessToken();

    await updateRegistration(
      programIdOCW,
      registrationOCW6Fail.referenceId,
      { fullName: 'John Doe' },
      'automated test',
      accessToken,
    );
    await paymentPage.retryFailedTransfers();
  });

  await test.step('Check presence of retry button', async () => {
    await paymentPage.validateRetryFailedTransfersButtonToBeHidden();
  });
});
