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

let paymentPage: PaymentPage;
let paymentsPage: PaymentsPage;
const programTitle = NLRCProgram.titlePortal.en;
const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;
const paymentPageUrl = `/en-GB/program/${programIdOCW}/payments/1`;
const registrations = [...registrationsOCW, registrationOCW6Fail];

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrations, programIdOCW, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();

  paymentPage = new PaymentPage(page);
  paymentsPage = new PaymentsPage(page);

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(programTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) => url.pathname.startsWith(paymentPageUrl));
    await paymentPage.approvePayment();
    await paymentPage.startPayment();

    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });
});

test('Retry failed transactions without filtering', async ({ page }) => {
  await test.step('Check presence of retry button', async () => {
    await paymentPage.waitForPaymentToComplete();
    await page.goto(paymentPageUrl, {
      waitUntil: 'networkidle',
    });
    await paymentPage.validateRetryFailedTransactionsButtonToBeVisible();
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

    await paymentPage.retryFailedTransactions({
      totalTransactions: registrations.length,
      failedTransactions: 1,
      filterFirst: false,
    });
  });

  await test.step('Check presence of retry button', async () => {
    await paymentPage.validateRetryFailedTransactionsButtonToBeHidden();
  });
});

test('Retry failed transactions with filtering on failed transactions', async ({
  page,
}) => {
  await test.step('Check presence of retry button', async () => {
    await paymentPage.waitForPaymentToComplete();
    await page.goto(paymentPageUrl, {
      waitUntil: 'networkidle',
    });
    await paymentPage.validateRetryFailedTransactionsButtonToBeVisible();
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

    // retry with filtering on 'failed' transactions first
    await paymentPage.retryFailedTransactions({
      totalTransactions: registrations.length,
      failedTransactions: 1,
      filterFirst: true,
    });
  });

  await test.step('Check presence of retry button', async () => {
    await paymentPage.validateRetryFailedTransactionsButtonToBeHidden();
  });
});
