import { test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationData from '@121-e2e/portal/pages/RegistrationData';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

// KOBO INTEGRATION DETAILS
const koboIntegrationDetails = {
  url: env.KOBO_SERVER_URL,
  assetId: 'success-asset',
  apiKey: env.KOBO_TOKEN,
};

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.safaricomProgram, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsSafaricom,
    programIdSafaricom,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Add Kobo integration successfully', async ({ page }) => {
  const homePage = new HomePage(page);
  const registrations = new RegistrationsPage(page);
  const registrationData = new RegistrationData(page);

  await test.step('Navigate to program', async () => {
    await homePage.selectProgram('Safaricom program');
  });

  await test.step('Navigate to Registration Data configuration', async () => {
    await registrations.navigateToProgramPage('Settings');
    await registrationData.clickRegistrationDataSection();
  });

  await test.step('Add Kobo integration', async () => {
    await registrationData.addKoboToolboxIntegration({
      url: koboIntegrationDetails.url,
      assetId: koboIntegrationDetails.assetId,
      apiKey: koboIntegrationDetails.apiKey,
    });

    await registrationData.validateKoboInegrationSuccessfulMessage();
  });
});
