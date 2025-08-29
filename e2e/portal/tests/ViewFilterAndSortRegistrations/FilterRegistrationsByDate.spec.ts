import { test } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

// Get current date information
const currentDate = new Date();
const day = currentDate.getDate();
const month = currentDate.getMonth();
const year = currentDate.getFullYear();
const formattedDate = `${year}-${month}-${day}`;

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();

  await seedRegistrationsWithStatus(
    registrationsPV,
    projectIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
  // Navigate to project
  await loginPage.selectProject('NLRC Direct Digital Aid Project (PV)');
});

test('[34947] Filter registrations by Date selection', async ({ page }) => {
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter registration created column by "Date is" date', async () => {
    // Filter Registration column by date
    await tableComponent.filterColumnByDate({
      columnName: 'Registration created',
      day: formattedDate,
      filterMode: 'Date is',
    });
    await tableComponent.validateAllRecordsCount(4);
    await tableComponent.clearAllFilters();
    // Filter by different date
    const diffDayNum = currentDate.getDate() === 1 ? 2 : 1;
    const diffDate = new Date(currentDate);
    diffDate.setDate(diffDayNum);
    const diffFormattedDate = `${diffDate.getFullYear()}-${diffDate.getMonth()}-${diffDayNum}`;
    if (diffFormattedDate !== undefined) {
      await tableComponent.filterColumnByDate({
        columnName: 'Registration created',
        day: diffFormattedDate,
        filterMode: 'Date is',
      });
    }
    await tableComponent.assertEmptyTableState();
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter registration created column by "Date is before" date', async () => {
    // Filter Registration column by date
    await tableComponent.filterColumnByDate({
      columnName: 'Registration created',
      day: formattedDate,
      filterMode: 'Date is before',
    });
    await tableComponent.assertEmptyTableState();
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter registration created column by "Date is after" date', async () => {
    // Filter Registration column by date
    await tableComponent.filterColumnByDate({
      columnName: 'Registration created',
      day: formattedDate,
      filterMode: 'Date is after',
    });
    await tableComponent.assertEmptyTableState();
  });
});
