import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProject from '@121-service/src/seed-data/project/project-nlrc-pv.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
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
  await seedPaidRegistrations([registrationPV5], projectIdPV); // Seeds a registration that does not have Visa as fsp so there is not debit card usage to export

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[36880] Export debit card usage unsuccessfully', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  // Act
  await paymentsPage.selectProject(NLRCProject.titlePortal.en);
  await paymentsPage.navigateToProjectPage('Payments');
  await paymentsPage.selectPaymentExportOption({ option: 'Debit card usage' });
  // Click on Proceed button
  await exportDataComponent.clickProceedToExport();

  // Assert
  await paymentsPage.validateExportMessage({
    message: 'There is currently no data to export',
  });
});
