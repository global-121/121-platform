import { expect, test } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
  registrationPV7,
  registrationPV8,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

let registrationName: string;
const visaFsp = 'Visa debit card';

// Arrange
test.beforeEach(async ({ page }) => {
  const accessToken = await getAccessToken();
  await resetDB(SeedScript.nlrcMultiple);

  await seedRegistrationsWithStatus(
    [registrationPV5, registrationPV6, registrationPV7],
    programIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  await resetDuplicateRegistrations(15);
  // Seed a specific registration for testing the filter under big load
  await seedRegistrationsWithStatus(
    [registrationPV8],
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

test('[36750] Filter the table with 100k registrations', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter Name column by text', async () => {
    await page.waitForTimeout(5000); // Wait for the table to load under big load
    await page.reload();
    await tableComponent.filterColumnByText('Name', 'Jan Janssen');
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jan Janssen');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Phone Number column by text', async () => {
    await page.reload();
    await tableComponent.filterColumnByText('Phone Number', '14155235557');
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jack Strong');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter FSP column by Visa debit card', async () => {
    // First ensure the FSP column is visible
    await registrations.manageTableColumns(['FSP']);
    // Filter by Visa debit card
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: visaFsp,
    });

    await page.waitForTimeout(2000); // Wait for the table to load under big load
    // Validate the first record in the table
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    console.log('registrationName: ', registrationName);
    await tableComponent.validateLabelInTableByRegistrationName(
      registrationName,
      visaFsp,
    );
    await tableComponent.validateAllRecordsCount(32769); // 32769 is the expected count for Visa debit card registrations
  });
});
