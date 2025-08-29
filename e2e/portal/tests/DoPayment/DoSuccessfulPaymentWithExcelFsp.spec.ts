import { test } from '@playwright/test';
import { format } from 'date-fns';

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

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

// Export Excel FSP payment list
const amount = NLRCProjectPV.fixedTransferValue;

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

test('[31972] Do payment for excel fsp', async ({ page }) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  const projectTitle = NLRCProjectPV.titlePortal.en;
  const numberOfPas = registrationsPvExcel.length;
  const defaultTransferValue = amount;
  const defaultMaxTransferValue = registrationsPvExcel.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const fsps: string[] = ['Excel Payment Instructions'];

  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Project payments', async () => {
    await paymentsPage.selectProject(projectTitle);

    await paymentsPage.navigateToProjectPage('Payments');
  });

  await test.step('Create payment', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.validateExcelFspInstructions();
  });

  await test.step('Do payment', async () => {
    await paymentsPage.validatePaymentSummary({
      fsp: fsps,
      registrationsNumber: numberOfPas,
      currency: '€',
      paymentAmount: defaultMaxTransferValue,
    });
    await paymentsPage.startPayment();
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${projectIdPV}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Download payment instructions', async () => {
    await paymentPage.selectPaymentExportOption({
      option: 'Export FSP payment list',
    });
    await exportDataComponent.exportAndAssertData({
      exactRowCount: 4,
    });
  });
});
