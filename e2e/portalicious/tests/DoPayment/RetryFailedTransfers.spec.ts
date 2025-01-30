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

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import PaymentsPage from '@121-e2e/portalicious/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [...registrationsOCW, registrationOCW6Fail],
    programIdOCW,
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

test('[32300] Retry failed transfers', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NLRCProgram.titlePortal.en;
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
      url.pathname.startsWith('/en-GB/project/3/payments/1'),
    );
    // Assert payment overview page by payment date/ title
    await paymentsPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Check presence of retry button', async () => {
    await paymentsPage.validateRetryFailedTransfersButtonToBeVisible();
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
    await paymentsPage.retryFiledTransfers();
  });

  // DO NOT MAKE IT A RULE!!!
  // Only in this case we need to reload the page to get the updated data of the successful payments.
  // This is a workaround for the case when the PA is subscribed to the program that uses telecom provider. And the data is updated asynchronously with other payment methods.
  await page.reload();

  await test.step('Check presence of retry button', async () => {
    await paymentsPage.validateRetryFailedTransfersButtonToBeHidden();
  });
});
