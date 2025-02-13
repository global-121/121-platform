import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import {
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvExcel5Fail,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import PaymentsPage from '@121-e2e/portalicious/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [...registrationsPvExcel, registrationPvExcel5Fail],
    programIdPV,
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

test('[32304] Retry payments should put failed transactions back in pending and download the payment instructions file for those pending transactions', async ({
  page,
}) => {
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NLRCProgramPV.titlePortal.en;
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
      url.pathname.startsWith(`/en-GB/project/${programIdPV}/payments/1`),
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
      programIdPV,
      registrationPvExcel5Fail.referenceId,
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
