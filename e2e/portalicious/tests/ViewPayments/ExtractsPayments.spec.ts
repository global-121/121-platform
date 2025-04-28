import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
// import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import PaymentsPage from '@121-e2e/portalicious/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, OcwProgramId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[] ExtractFivePayments', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);

  const projectTitle = 'NLRC OCW Program';
  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);
    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Create 5 payments', async () => {
    for (let i = 0; i < 5; i++) {
      await paymentsPage.createPayment();
      await paymentsPage.startPayment();
      await paymentsPage.navigateToProgramPage('Payments');
    }
  });

  await test.step('Validate export payment button', async () => {
    await paymentsPage.exportButton.waitFor({ state: 'visible' });
  });

  await test.step('Export and validate file', async () => {
    await paymentsPage.selectPaymentExportOption({
      option: 'Export last 5 payment(s)',
    });

    await paymentsPage.exportAndAssertData();
  });
});
