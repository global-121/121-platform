import { test } from '@playwright/test';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { triggerUnusedVouchersCache } from '@121-service/test/helpers/fsp-specific.helper';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);

  await doPayment({
    programId: programIdPV,
    transferValue: 12.5,
    referenceIds: [registrationPV5.referenceId],
    accessToken,
  });

  await waitForPaymentTransactionsToComplete({
    programId: programIdPV,
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

test('Export unused vouchers successfully', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  // Act
  await paymentsPage.selectProgram(NLRCProgram.titlePortal.en);
  await paymentsPage.navigateToProgramPage('Payments');
  await paymentsPage.selectPaymentExportOption({ option: 'Unused vouchers' });

  // Assert
  await exportDataComponent.exportAndAssertData({
    minRowCount: 1,
    excludedColumns: ['issueDate', 'lastExternalUpdate'],
  });
});
