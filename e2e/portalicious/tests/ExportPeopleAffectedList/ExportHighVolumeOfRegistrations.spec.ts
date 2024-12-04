import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import { registrationPV8 } from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

// Export selected registrations
const status = 'included';
const id = 1;
const paymentAmountMultiplier = 1;
const preferredLanguage = 'en';
const fspDisplayName = 'Visa debit card';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV8], programIdPV, accessToken);
  await resetDuplicateRegistrations(14);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[29359] Export inclusion list with 15000 PAs', async ({ page }) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Select program', async () => {
    await basePage.selectProgram(projectTitle);
  });

  await test.step('Export list and validate XLSX file downloaded', async () => {
    await registrations.selectAllRegistrations();
    await registrations.clickAndSelectExportOption(
      'Export selected registrations',
    );
    await registrations.exportAndAssertSelectedRegistrations(
      0,
      {
        id,
        status,
        paymentAmountMultiplier,
        preferredLanguage,
        programFinancialServiceProviderConfigurationLabel: fspDisplayName,
      },
      { condition: true, minRowCount: 15000 },
    );
  });
});
