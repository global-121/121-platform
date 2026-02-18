import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('[Bug] Clear all filters does not work', async ({
  registrationsPage,
  resetDBAndSeedRegistrations,
}) => {
  await test.step('Setup and seed database', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  await test.step('Apply filter and then clear all filters', async () => {
    // Count all registrations
    const allRegistrationsCount = registrationsPV.length;

    // Wait for page to load
    await registrationsPage.waitForLoaded(allRegistrationsCount);
    await expect(registrationsPage.table.tableRows).toHaveCount(
      allRegistrationsCount,
    );

    // Get the first registration's full name from the table
    const registrationFullName =
      await registrationsPage.getFirstRegistrationNameFromTable();

    // Apply global search filter by full name
    await registrationsPage.table.globalSearch(registrationFullName);
    // Verify filter
    await expect(registrationsPage.table.tableRows).toHaveCount(1);

    // Clear all filters
    await registrationsPage.table.clearAllFilters();

    // Verify all registrations are displayed again
    await expect(registrationsPage.table.tableRows).toHaveCount(
      allRegistrationsCount,
    );
  });
});
