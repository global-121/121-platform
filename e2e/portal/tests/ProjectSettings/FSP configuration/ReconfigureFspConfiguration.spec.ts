import test from '@playwright/test';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import FspSettingsPage from '@121-e2e/portal/pages/FspSettingsPage';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const configuredFsps = [
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherWhatsapp].defaultLabel.en,
].filter((label): label is string => label !== undefined);

const visaConfiguration = [
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  // eslint-disable-next-line n/no-process-env
  process.env.INTERSOLVE_VISA_BRAND_CODE,
  // eslint-disable-next-line n/no-process-env
  process.env.INTERSOLVE_VISA_COVER_LETTER_CODE,
  // eslint-disable-next-line n/no-process-env
  process.env.INTERSOLVE_VISA_FUNDING_TOKEN_CODE,
].filter((item): item is string => item !== undefined);

const newVisaConfiguration = [
  'PKO BPAY debit card', // Fsp name
  'UI_CPO1', // Brand code
  'RC02', // Cover letter code
  '510121323', // Funding token code
];

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
    await fspSettings.openEditFspConfigurationByName(FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en);
    await fspSettings.validateFspConfiguration(visaConfiguration);
  });

  await test.step('Reconfigure Visa debit card FSP', async () => {
    await fspSettings.reconfigureFsp(newVisaConfiguration);
  });

  await test.step('Validate new Visa debit card was reconfigured', async () => {
    await fspSettings.openEditFspConfigurationByName(newVisaConfiguration[0]);
    await fspSettings.validateFspConfiguration(newVisaConfiguration);
  });
});
