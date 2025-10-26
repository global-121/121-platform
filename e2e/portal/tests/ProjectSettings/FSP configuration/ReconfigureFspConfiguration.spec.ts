import test from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import FspSettingsPage from '@121-e2e/portal/pages/FspSettingsPage';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const configuredFsps = ['Visa debit card', 'Albert Heijn voucher WhatsApp'];
const visaConfigurationCi = [
  'Visa debit card',
  'test-INTERSOLVE_VISA_BRAND_CODE',
  'TESTINTERSOLVEVISACOVERLETTERCODE',
  'test_INTERSOLVE_VISA_FUNDINGTOKEN_CODE',
];
const visaConfigurationLocal = [
  'Visa debit card',
  'Ix906_01',
  'RC01',
  '6375100999151000001',
];
const newVisaConfiguration = [
  'PKO BPAY debit card',
  'UI_CPO1',
  'RC02',
  '510121323',
];

// Configuration to use based on environment
// eslint-disable-next-line n/no-process-env
const isCI = process.env.CI === 'true';
const visaConfiguration = isCI ? visaConfigurationCi : visaConfigurationLocal;

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  await getAccessToken();

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Reconfigure FSP', async ({ page }) => {
  const homePage = new HomePage(page);
  const registrations = new RegistrationsPage(page);
  const fspSettings = new FspSettingsPage(page);

  await test.step('Navigate to program', async () => {
    await homePage.selectProgram('NLRC OCW program');
  });

  await test.step('Navigate to FSP configuration', async () => {
    await registrations.navigateToProgramPage('Settings');
    await fspSettings.clickEditFspSection();
  });

  await test.step('Validate that configured FSPs are visible', async () => {
    await fspSettings.validateFspVisibility({
      fspNames: configuredFsps,
    });
  });

  await test.step('Check Visa debit card configuration', async () => {
    await fspSettings.openEditFspConfigurationByName('Visa debit card');
    await fspSettings.validateFspConfiguration(visaConfiguration);
  });

  await test.step('Reconfigure Visa debit card FSP', async () => {
    await fspSettings.reconfigureFsp(newVisaConfiguration);
  });

  await test.step('Validate new Visa debit card was reconfigured', async () => {
    await fspSettings.openEditFspConfigurationByName('PKO BPAY debit card');
    await fspSettings.validateFspConfiguration(newVisaConfiguration);
  });
});
