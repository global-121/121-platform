import { test } from '@playwright/test';
import { format } from 'date-fns';
import path from 'path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProjectPV from '@121-service/src/seed-data/project/project-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsPvExcel,
    projectIdPV,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[32303] [Excel fsp]: Import reconciliation data should work similar to import registration data', async ({
  page,
}) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);

  const projectTitle = NLRCProjectPV.titlePortal.en;
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;
  const reconciliationData = path.resolve(
    __dirname,
    '../../../test-registration-data/test-reconciliation-Excel-pv.csv',
  );

  await test.step('Navigate to Project payments', async () => {
    await paymentsPage.selectProject(projectTitle);

    await paymentsPage.navigateToProjectPage('Payments');
  });

  await test.step('Start payment', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.startPayment();
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${projectIdPV}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Upload payment reconciliation data via UI', async () => {
    await paymentPage.importReconciliationData(reconciliationData);
  });

  // ## TODO: this process downloads a file, assert that that happens and the content is correct
});
