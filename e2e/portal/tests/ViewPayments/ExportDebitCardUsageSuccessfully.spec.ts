import { test } from '@playwright/test';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { waitForPaymentAndTransactionsToComplete } from '@121-service/test/helpers/program.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedPaidRegistrations({
    registrations: registrationsOCW,
    programId: programIdOCW,
  });

  await waitForPaymentAndTransactionsToComplete({
    programId: programIdOCW,
    paymentReferenceIds: registrationsOCW.map(
      (registration) => registration.referenceId,
    ),
    accessToken,
    maxWaitTimeMs: 2_000,
    completeStatuses: [
      TransactionStatusEnum.success,
      TransactionStatusEnum.waiting,
    ],
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Export debit card usage', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  // Act
  await paymentsPage.selectProgram(NLRCProgram.titlePortal.en);
  await paymentsPage.navigateToProgramPage('Payments');
  await paymentsPage.selectPaymentExportOption({ option: 'Debit card usage' });

  // Assert
  await exportDataComponent.exportAndAssertData({
    minRowCount: 4,
    excludedColumns: ['issuedDate', 'cardNumber'],
  });
});
