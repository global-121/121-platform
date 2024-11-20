import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[31475] [Bug] Portalicious clear all filters does not work', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Select program', async () => {
    await basePage.selectProgram(projectTitle);
  });

  await test.step('Decline one PA apply filter and clear all filters', async () => {
    // Get the first registration's full name from the table
    const registrationFullName =
      await registrations.getFirstRegistrationNameFromTable();
    if (!registrationFullName) {
      throw new Error('Registration full name is undefined');
    }
    // Decline the registration by name
    await registrations.performActionOnRegistrationByName({
      action: 'Decline',
      registrationName: registrationFullName,
    });
    await registrations.clickApproveButton();
    // Count all registrations
  });
});
