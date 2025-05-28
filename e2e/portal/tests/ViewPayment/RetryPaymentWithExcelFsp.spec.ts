import { test } from '@playwright/test';
import { format } from 'date-fns';
import path from 'path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsPvExcel,
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
  const registrationsPage = new RegistrationsPage(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;
  const reconciliationData = path.join(
    __dirname,
    '../../../test-registration-data/test-reconciliation-Excel-pv.csv',
  );

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

  await test.step('Upload payment reconciliation data', async () => {
    await paymentsPage.importReconciliationData(reconciliationData);
  });

  // ## TODO: this process downloads a file, assert that that happens and the content is correct

  await test.step('Retry payment, Export FSP payment data and assert file', async () => {
    await paymentsPage.validateRetryFailedTransfersButtonToBeVisible();
    // Timeout has to be used in this case because choose option is not visible immediately after the dropdown button is clicked
    await page.waitForTimeout(200);
    await paymentsPage.retryFailedTransfers();
    // Start download of the payment instructions file
    await paymentsPage.exportFspPaymentList();
    // Assert excel fsp list it should only include the failed transactions that were retried and are now in status pending
    await registrationsPage.exportAndAssertData({
      exactRowCount: 2,
    });
  });
});
