import { test } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';

// Get current date information
const currentDate = new Date();
const day = currentDate.getDate();

// Arrange
test.beforeEach(async ({ page }) => {
  const accessToken = await getAccessToken();
  await resetDB(SeedScript.nlrcMultiple);

  await seedRegistrationsWithStatus(
    registrationsPV,
    programIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  // Navigate to program
  await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('[34947] Filter registrations by Date selection', async ({ page }) => {
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter registration created column by "Equals" date', async () => {
    // Filter Registration column by date
    await tableComponent.filterColumnByDate({
      columnName: 'Registration created',
      day,
      filterMode: 'Equals',
    });
    await tableComponent.validateAllRecordsCount(4);
    await tableComponent.clearAllFilters();
    // Filter by different date
    const diffDay = currentDate.getDate() === 1 ? 2 : 1;
    if (diffDay !== undefined) {
      await tableComponent.filterColumnByDate({
        columnName: 'Registration created',
        day: diffDay,
        filterMode: 'Equals',
      });
    }
    await tableComponent.assertEmptyTableState();
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter registration created column by "Less than" date', async () => {
    // Filter Registration column by date
    await tableComponent.filterColumnByDate({
      columnName: 'Registration created',
      day,
      filterMode: 'Less than',
    });
    await tableComponent.assertEmptyTableState();
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter registration created column by "Greater than" date', async () => {
    // Filter Registration column by date
    await tableComponent.filterColumnByDate({
      columnName: 'Registration created',
      day,
      filterMode: 'Greater than',
    });
    await tableComponent.assertEmptyTableState();
  });
});
