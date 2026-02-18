import { expect } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPvMaxPayment,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

let registrationName: string;

test('Filter registrations by Input number', async ({
  registrationsPage,
  tableComponent,
  resetDBAndSeedRegistrations,
}) => {
  await test.step('Setup and seed database', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      seedPaidRegistrations: true,
      registrations: [...registrationsPV, registrationPvMaxPayment],
      programId: programIdPV,
      seedWithStatus: RegistrationStatusEnum.included,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

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
