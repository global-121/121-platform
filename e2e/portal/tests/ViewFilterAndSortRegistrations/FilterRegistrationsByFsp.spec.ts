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

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

let registrationName: string;
const ahVoucherFsp = 'Albert Heijn voucher WhatsApp';
const visaFsp = 'Visa debit card';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();

  await seedRegistrationsWithStatus(
    registrationsPV,
    programIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
  // Navigate to program
  await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('Filter registrations by FSP (from the bug)', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act & Assert
  // First ensure the FSP column is visible
  await test.step('Display FSP column in the table', async () => {
    await registrations.configureTableColumns({ columns: ['FSP'] });
  });

  // Test filtering by Visa FSP
  await test.step('Filter FSP column by Visa debit card', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: visaFsp,
    });

    registrationName = await registrations.getFirstRegistrationNameFromTable();
    await tableComponent.validateLabelInTableByRegistrationName(
      registrationName,
      visaFsp,
    );
    await tableComponent.validateAllRecordsCount(2);
    await tableComponent.clearAllFilters();
  });

  // Test filtering by Albert Heijn voucher FSP
  await test.step('Filter FSP column by Albert Heijn voucher', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: ahVoucherFsp,
    });

    registrationName = await registrations.getFirstRegistrationNameFromTable();
    await tableComponent.validateLabelInTableByRegistrationName(
      registrationName,
      ahVoucherFsp,
    );
    await tableComponent.validateAllRecordsCount(2);
  });
});
