import { test } from '@playwright/test';
import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProject from '@121-service/src/seed-data/project/project-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const projectIdOCW = 3;
  const OcwProjectId = projectIdOCW;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, OcwProjectId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[31971] Show payment summary', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);

  const projectTitle = 'NLRC OCW Project';
  const fsps: string[] = ['Albert Heijn voucher WhatsApp', 'Visa debit card'];
  const numberOfPas = registrationsOCW.length;
  const defaultTransferValue = NLRCProject.fixedTransferValue;
  const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to Project payments', async () => {
    await paymentsPage.selectProject(projectTitle);
    await paymentsPage.navigateToProjectPage('Payments');
  });

  await test.step('Create payment', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.validatePaymentSummary({
      fsp: fsps,
      registrationsNumber: numberOfPas,
      currency: '€',
      paymentAmount: defaultMaxTransferValue,
    });
  });
});

test('[31972] Validate empty payment page', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);

  const projectTitle = 'NLRC OCW Project';

  await test.step('Navigate to Project payments', async () => {
    await paymentsPage.selectProject(projectTitle);
    await paymentsPage.navigateToProjectPage('Payments');
  });

  await test.step('Validate empty payment summary', async () => {
    const isEmpty = await paymentsPage.isPaymentPageEmpty();
    expect(isEmpty).toBe(true);
  });
});
