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

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsPvExcel,
    programIdPV,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[32304] Retry payments should put failed transactions back in pending and download the payment instructions file for those pending transactions', async ({
  page,
}) => {
  const paymentsPage = new PaymentsPage(page);
  const paymentPage = new PaymentPage(page);
  const exportDataComponent = new ExportData(page);

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
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdPV}/payments/1`),
    );
    await paymentPage.startPayment();
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Upload payment reconciliation data', async () => {
    await paymentPage.importReconciliationData(reconciliationData);
  });

  // ## TODO: this process downloads a file, assert that that happens and the content is correct

  await test.step('Retry payment, Export FSP payment data and assert file', async () => {
    await paymentPage.validateRetryFailedTransfersButtonToBeVisible();
    // Timeout has to be used in this case because choose option is not visible immediately after the dropdown button is clicked
    await page.waitForTimeout(200);
    await paymentPage.retryFailedTransfers();
    // Start download of the payment instructions file
    await paymentPage.selectPaymentExportOption({
      option: 'Export FSP payment list',
    });
    // Assert excel fsp list it should only include the failed transactions that were retried and are now in status pending
    await exportDataComponent.exportAndAssertData({
      exactRowCount: 2,
    });
  });
});
