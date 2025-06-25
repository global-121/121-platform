import { test } from '@playwright/test';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
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
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, programIdOCW, accessToken);

  await doPayment({
    programId: programIdOCW,
    paymentNr: 1,
    amount: 25,
    referenceIds: registrationsOCW.map(
      (registration) => registration.referenceId,
    ),
    accessToken,
  });

  await waitForPaymentTransactionsToComplete({
    programId: programIdOCW,
    paymentReferenceIds: registrationsOCW.map(
      (registration) => registration.referenceId,
    ),
    accessToken,
    maxWaitTimeMs: 2_000,
    completeStatusses: [
      TransactionStatusEnum.success,
      TransactionStatusEnum.waiting,
    ],
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[36878] Export debit card usage', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const registrationsPage = new RegistrationsPage(page);

  // Act
  await paymentsPage.selectProgram(NLRCProgram.titlePortal.en);
  await paymentsPage.navigateToProgramPage('Payments');
  await paymentsPage.selectPaymentExportOption({ option: 'Debit card usage' });

  // Assert
  await registrationsPage.exportAndAssertData({
    minRowCount: 4,
    excludedColumns: ['issuedDate', 'cardNumber'],
  });
});
