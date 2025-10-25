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
const availableFsps = [
  'Excel Payment Instructions',
  'Albert Heijn voucher paper',
  'Safaricom',
  'Airtel',
  'Commercial Bank of Ethiopia',
  'Nedbank',
  'Onafriq',
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

test('Validate that only configured FSPs are present as configured', async ({
  page,
}) => {
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

  await test.step('Validate only assigned FSPs are visible at first', async () => {
    await fspSettings.validateFspVisibility({ fspNames: configuredFsps });
  });

  await test.step('Validate unassigned FSPs are not visible', async () => {
    await fspSettings.validateFspVisibility({
      fspNames: availableFsps,
      visible: false,
    });
  });

  await test.step('Validate that both assigned and configurable FSPs are visible', async () => {
    await fspSettings.clickAddAnotherFspButton();
    await fspSettings.validateFspVisibility({
      fspNames: [...configuredFsps, ...availableFsps],
    });
  });
});
