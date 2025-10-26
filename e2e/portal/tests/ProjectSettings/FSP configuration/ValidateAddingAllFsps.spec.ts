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

const fspsToDelete = ['Visa debit card', 'Albert Heijn voucher WhatsApp'];

const availableFsps = [
  'Albert Heijn voucher paper',
  'Safaricom',
  'Airtel',
  'Commercial Bank of Ethiopia',
  'Nedbank',
  'Onafriq',
  'Visa debit card',
  'Albert Heijn voucher WhatsApp',
];

const fspsConfiguredInKobo = [
  'Albert Heijn voucher paper',
  'Airtel',
  'Nedbank',
  'Visa debit card',
  'Albert Heijn voucher WhatsApp',
  'Excel Payment Instructions',
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

  await test.step('Add all available FSPs that match kobo form configuration', async () => {
    await fspSettings.addFsp({ fspName: fspsConfiguredInKobo });
  });

  await test.step('Validate that only selected FSPs were configured', async () => {
    await fspSettings.validateFspVisibility({
      fspNames: fspsConfiguredInKobo,
    });
  });
});
