import { expect } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
    // No registrations necessary for test.
    skipSeedRegistrations: true,
    seedWithStatus: RegistrationStatusEnum.included,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('When we change which columns are visible we want to keep seeing the correct filter options', async ({
  page,
  registrationsPage,
}) => {
  // Arrange
  await registrationsPage.configureTableColumns({
    columns: ['Name', 'Registration Status'],
    onlyGivenColumns: true,
  });

  // Act
  await registrationsPage.configureTableColumns({
    columns: ['Registration Status'],
    onlyGivenColumns: true,
  });

  // Assert
  const table = page.getByTestId('query-table');
  const filterMenuButton = table
    .getByRole('columnheader', { name: 'Registration Status' })
    .getByLabel('Show Filter Menu');
  await filterMenuButton.scrollIntoViewIfNeeded();
  await filterMenuButton.click();
  const filterOverlay = page.getByRole('dialog');
  await filterOverlay.waitFor({ state: 'visible' });
  await expect(filterOverlay).toContainText('Choose option(s)');
});
