import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
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

test('[31970] Do successful payment', async ({ page }) => {
  const basePage = new BasePage(page);
  const payments = new PaymentsPage(page);

  const projectTitle = 'NLRC OCW Program';
  const financialServiceProviders: string[] = [
    'Visa debit card',
    'Albert Heijn voucher WhatsApp',
  ];
  const numberOfPas = registrationsOCW.length;
  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to Program payments', async () => {
    await basePage.selectProgram(projectTitle);

    await payments.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await payments.createPayment();
    await payments.validatePaymentSummary({
      fsp: financialServiceProviders,
      registrationsNumber: numberOfPas,
      paymentAmount: defaultMaxTransferValue,
    });
    await payments.startPayment();
  });

  await test.step('Validate payment card', async () => {
    await payments.validateToastMessage('Payment created.');
    await payments.navigateToProgramPage('Payments');
    // TODO: Validate payment status card
  });
});