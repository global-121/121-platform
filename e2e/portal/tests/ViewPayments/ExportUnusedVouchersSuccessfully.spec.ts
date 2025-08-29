import { test } from '@playwright/test';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProject from '@121-service/src/seed-data/project/project-nlrc-pv.json';
import { triggerUnusedVouchersCache } from '@121-service/test/helpers/intersolve-voucher.helper';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], projectIdPV, accessToken);

  await doPayment({
    projectId: projectIdPV,
    amount: 12.5,
    referenceIds: [registrationPV5.referenceId],
    accessToken,
  });

  await waitForPaymentTransactionsToComplete({
    projectId: projectIdPV,
    paymentReferenceIds: [registrationPV5.referenceId],
    accessToken,
    maxWaitTimeMs: 2_000,
    completeStatusses: [
      TransactionStatusEnum.success,
      TransactionStatusEnum.waiting,
    ],
  });
  // Run cronJob to process unused vouchers
  await triggerUnusedVouchersCache(accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[36847] Export unused vouchers successfully', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  // Act
  await paymentsPage.selectProject(NLRCProject.titlePortal.en);
  await paymentsPage.navigateToProjectPage('Payments');
  await paymentsPage.selectPaymentExportOption({ option: 'Unused vouchers' });

  // Assert
  await exportDataComponent.exportAndAssertData({
    minRowCount: 1,
    excludedColumns: ['issueDate', 'lastExternalUpdate'],
  });
});
