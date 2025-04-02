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
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

// Get current date information
const currentDate = new Date();
const month = currentDate.toLocaleString('en-US', { month: 'long' });
const day = currentDate.getDate();
const year = currentDate.getFullYear().toString();

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
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter registrations columns by date', async () => {
    // Filter Registration column by date
    await tableComponent.filterColumnByDate({
      columnName: 'Registration created',
      month,
      day,
      year,
    });
    await tableComponent.validateAllRecordsCount(4);
    // Filter by different date
    const diffDay = await registrations.selectDifferentDate(day, month, year);
    if (diffDay !== undefined) {
      await tableComponent.filterColumnByDate({
        columnName: 'Registration created',
        month,
        day: diffDay,
        year,
      });
    }
    await registrations.validateRegistrationIsNotPresent();
  });
});
