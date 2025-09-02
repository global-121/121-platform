import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProject from '@121-service/src/seed-data/project/project-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdOCW,
  registrationOCW1,
  registrationOCW6Fail,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [registrationOCW1, registrationOCW6Fail],
    projectIdOCW,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[35621] Export Payment Report should contain the right data', async ({
  page,
}) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  const projectTitle = NLRCProject.titlePortal.en;

  await test.step('Navigate to Project payments', async () => {
    await paymentsPage.selectProject(projectTitle);
  });

  for (let i = 1; i <= 2; i++) {
    // Do 2 payments to make sure that the export only contains the latest payment
    await test.step(`Do payment ${i}`, async () => {
      await paymentsPage.navigateToProjectPage('Payments');

      await paymentsPage.createPayment();
      await paymentsPage.startPayment();
      // Assert redirection to payment overview page
      await page.waitForURL((url) =>
        url.pathname.startsWith(`/en-GB/project/${projectIdOCW}/payments/${i}`),
      );
      await paymentPage.waitForPaymentToComplete();
    });
  }

  await test.step('Export Payment Report', async () => {
    await paymentPage.selectPaymentExportOption({
      option: 'Payment report',
    });

    await exportDataComponent.exportAndAssertData({
      exactRowCount: 2,
      excludedColumns: ['paymentDate', 'created', 'updated'],
    });
  });
});
