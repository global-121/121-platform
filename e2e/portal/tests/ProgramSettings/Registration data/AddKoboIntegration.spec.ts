import { test } from '@playwright/test';

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
import RegistrationDataPage from '@121-e2e/portal/pages/RegistrationDataPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const KOBO_SERVER_URL = 'http://mock-service:3001/api/kobo';
const KOBO_TOKEN = 'mock-token';

// KOBO INTEGRATION DETAILS
const koboIntegrationDetails = {
  url: KOBO_SERVER_URL,
  successfulAssetId: 'success-asset',
  unsuccessfulAssetId: 'asset-id-body-that-triggers-errors',
  apiKey: KOBO_TOKEN,
};

test.describe('Add Kobo integration and validate status messages', () => {
  test.beforeAll(async () => {
    await resetDB(SeedScript.safaricomProgram, __filename);
    const accessToken = await getAccessToken();
    await seedIncludedRegistrations(
      registrationsSafaricom,
      programIdSafaricom,
      accessToken,
    );
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    const registrations = new RegistrationsPage(page);
    const registrationData = new RegistrationDataPage(page);
    // Login before each test
    await page.goto('/');
    await loginPage.login();
    // Navigate to program and program settings
    await homePage.selectProgram('Safaricom program');
    await registrations.navigateToProgramPage('Settings');
    await registrationData.clickRegistrationDataSection();
  });

  test('Add Kobo integration successfully', async ({ page }) => {
    const registrationData = new RegistrationDataPage(page);

    await test.step('Add Kobo integration', async () => {
      await registrationData.addKoboToolboxIntegration({
        url: koboIntegrationDetails.url,
        assetId: koboIntegrationDetails.successfulAssetId,
        apiKey: koboIntegrationDetails.apiKey,
      });

      await registrationData.validateKoboIntegrationSuccessfulMessage();
    });
  });

  test('Add Kobo integration with invalid details and validate error message', async ({
    page,
  }) => {
    const registrationData = new RegistrationDataPage(page);

    await test.step('Add Kobo integration un-successfully', async () => {
      await registrationData.addKoboToolboxIntegration({
        url: koboIntegrationDetails.url,
        assetId: koboIntegrationDetails.unsuccessfulAssetId,
        apiKey: koboIntegrationDetails.apiKey,
      });

      await registrationData.validateKoboIntegrationErrorMessage();
    });
  });
});
