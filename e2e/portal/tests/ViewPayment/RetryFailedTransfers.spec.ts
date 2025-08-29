import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProject from '@121-service/src/seed-data/project/project-nlrc-ocw.json';
import {
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdOCW,
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
    projectIdOCW,
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
  const projectTitle = NLRCProject.titlePortal.en;
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
      url.pathname.startsWith(`/en-GB/project/${projectIdOCW}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Check presence of retry button', async () => {
    await paymentPage.validateRetryFailedTransfersButtonToBeVisible();
  });

  await test.step('Retry payment with correct PA values', async () => {
    const accessToken = await getAccessToken();

    await updateRegistration(
      projectIdOCW,
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
