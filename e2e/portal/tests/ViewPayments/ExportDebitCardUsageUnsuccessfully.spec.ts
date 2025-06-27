import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { doPayment } from '@121-service/test/helpers/program.helper';
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
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);

  await doPayment({
    programId: programIdPV,
    paymentNr: 1,
    amount: 12.5,
    referenceIds: [registrationPV5.referenceId],
    accessToken,
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[36880] Export debit card usage unsuccessfully', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  // Act
  await paymentsPage.selectProgram(NLRCProgram.titlePortal.en);
  await paymentsPage.navigateToProgramPage('Payments');
  await paymentsPage.selectPaymentExportOption({ option: 'Debit card usage' });
  // Click on Proceed button
  await exportDataComponent.clickProceedToExport();

  // Assert
  await paymentsPage.validateExportMessage({
    message: 'There is currently no data to export',
  });
});
