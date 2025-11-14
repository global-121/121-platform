import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[Bug] Clear all filters does not work', async ({ page }) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);

  const programTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Select program', async () => {
    await basePage.selectProgram(programTitle);
  });

  await test.step('Apply filter and then clear all filters', async () => {
    // Count all registrations
    const allRegistrationsCount = registrationsPV.length;

    // Wait for page to load
    await registrations.waitForLoaded(allRegistrationsCount);
    await expect(registrations.table.tableRows).toHaveCount(
      allRegistrationsCount,
    );

    // Get the first registration's full name from the table
    const registrationFullName =
      await registrations.getFirstRegistrationNameFromTable();

    // Apply global search filter by full name
    await registrations.table.globalSearch(registrationFullName);

    // Verify filter
    await expect(registrations.table.tableRows).toHaveCount(1);

    // Clear all filters
    await registrations.table.clearAllFilters();

    // Verify all registrations are displayed again
    await expect(registrations.table.tableRows).toHaveCount(
      allRegistrationsCount,
    );
  });
});
