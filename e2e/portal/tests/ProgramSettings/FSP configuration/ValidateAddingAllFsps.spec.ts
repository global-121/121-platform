import test from '@playwright/test';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import FspSettingsPage from '@121-e2e/portal/pages/FspSettingsPage';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const fspsToDelete = [
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherWhatsapp].defaultLabel.en,
].filter((label): label is string => label !== undefined);

const availableFsps = [
  ...fspsToDelete,
  FSP_SETTINGS[Fsps.excel].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherPaper].defaultLabel.en,
  FSP_SETTINGS[Fsps.safaricom].defaultLabel.en,
  FSP_SETTINGS[Fsps.airtel].defaultLabel.en,
  FSP_SETTINGS[Fsps.commercialBankEthiopia].defaultLabel.en,
  FSP_SETTINGS[Fsps.nedbank].defaultLabel.en,
  FSP_SETTINGS[Fsps.onafriq].defaultLabel.en,
].filter((label): label is string => label !== undefined);

const fspsNotConfigurableForOcwProgram = [
  FSP_SETTINGS[Fsps.safaricom].defaultLabel.en,
  FSP_SETTINGS[Fsps.commercialBankEthiopia].defaultLabel.en,
  FSP_SETTINGS[Fsps.onafriq].defaultLabel.en,
].filter((label): label is string => label !== undefined);

const fspsConfiguredInKobo = [
  FSP_SETTINGS[Fsps.intersolveVoucherPaper].defaultLabel.en,
  FSP_SETTINGS[Fsps.airtel].defaultLabel.en,
  FSP_SETTINGS[Fsps.nedbank].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherWhatsapp].defaultLabel.en,
  FSP_SETTINGS[Fsps.excel].defaultLabel.en,
].filter((label): label is string => label !== undefined);

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  await getAccessToken();

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Add all available FSPs', async ({ page }) => {
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

  await test.step('Delete All FSPs', async () => {
    await fspSettings.deleteFsp({
      fspName: fspsToDelete,
    });
  });

  await test.step('Validate all FSPs are ready for configuration', async () => {
    await fspSettings.validateFspVisibility({
      fspNames: availableFsps,
    });
  });

  await test.step('Add FSPs that do not match Kobo form configuration', async () => {
    await fspSettings.validateFspConfigurationIsNotPresent({
      fspNames: fspsNotConfigurableForOcwProgram,
    });
  });

  await test.step('Add all available FSPs that match Kobo form configuration', async () => {
    await fspSettings.addFsp({ fspNames: fspsConfiguredInKobo });
  });

  await test.step('Validate that only selected FSPs were configured', async () => {
    await fspSettings.validateFspVisibility({
      fspNames: fspsConfiguredInKobo,
    });
  });
});
