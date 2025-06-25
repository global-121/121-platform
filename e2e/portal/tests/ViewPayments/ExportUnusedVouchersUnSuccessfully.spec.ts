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
  registrationPV6,
  registrationsVoucher,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsVoucher,
    programIdPV,
    accessToken,
  );

  await doPayment({
    programId: programIdPV,
    paymentNr: 1,
    amount: 100,
    referenceIds: [registrationPV5.referenceId, registrationPV6.referenceId],
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

test('[36848] Export unused vouchers unsuccessfully', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);

  // Act
  await paymentsPage.selectProgram(NLRCProgram.titlePortal.en);
  await paymentsPage.navigateToProgramPage('Payments');
  await paymentsPage.selectPaymentExportOption({ option: 'Unused vouchers' });
  await page.getByRole('button', { name: 'Proceed' }).click();

  // Assert
  await paymentsPage.validateExportMessage({
    message: 'There is currently no data to export',
  });
});
