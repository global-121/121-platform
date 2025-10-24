import { expect, test } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { createAndStartPayment } from '@121-service/test/helpers/program.helper';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

let registrationName: string;

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();

  registrationsPV.push(registrationPvMaxPayment);
  await seedRegistrationsWithStatus(
    registrationsPV,
    programIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  await createAndStartPayment({
    programId: 2,
    transferValue: 25,
    referenceIds: [registrationsPV[0].referenceId],
    accessToken,
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
  // Navigate to program
  await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('[34948] Filter registrations by Input number', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);

  // Act & Assert
  await test.step('Filter Reg. # column by number 2', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Reg. #',
      filterNumber: 2,
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jan Janssen');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Number of payments column by number 1', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Number of payments',
      filterNumber: 1,
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Gemma Houtenbos');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Max payments column by number 1', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Max payments',
      filterNumber: 1,
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Arkadiusz Zbuczko');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Max payments with "Less than" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Max payments',
      filterNumber: 1,
      filterMode: 'Less than',
    });
    await tableComponent.assertEmptyTableState();
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Max payments with "Greater than" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Max payments',
      filterNumber: 0,
      filterMode: 'Greater than',
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Arkadiusz Zbuczko');
    await tableComponent.validateAllRecordsCount(1);
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter "Reg. #" with "Greater than" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Reg. #',
      filterNumber: 3,
      filterMode: 'Greater than',
    });
    await tableComponent.validateAllRecordsCount(2);
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter "Reg. #" with "Less than" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Reg. #',
      filterNumber: 4,
      filterMode: 'Less than',
    });
    await tableComponent.validateAllRecordsCount(3);
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter "Reg. #" with "Not equal to" number input', async () => {
    await tableComponent.filterColumnByNumber({
      columnName: 'Reg. #',
      filterNumber: 4,
      filterMode: 'Not equal to',
    });
    await tableComponent.validateAllRecordsCount(4);
    await tableComponent.clearAllFilters();
  });
});
