import { expect } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

let registrationName: string;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
    seedWithStatus: RegistrationStatusEnum.included,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('Filter registrations by text', async ({
  registrationsPage,
  tableComponent,
}) => {
  // Act & Assert
  await test.step('Filter Name column by text', async () => {
    await tableComponent.filterColumnByText({
      columnName: 'Name',
      filterText: 'Jan Janssen',
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jan Janssen');
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Phone Number column by text', async () => {
    await tableComponent.filterColumnByText({
      columnName: 'Phone Number',
      // defaults to "contains" filter type
      filterText: '35557',
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jack Strong');
    await tableComponent.validateWaitForTableRowCount({ expectedRowCount: 1 });
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Phone Number column by "Equals" text', async () => {
    await tableComponent.filterColumnByText({
      columnName: 'Phone Number',
      filterText: '14155235557',
      filterMode: 'Equal to',
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Jack Strong');
    await tableComponent.validateWaitForTableRowCount({ expectedRowCount: 1 });
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Phone Number column by "Not equals" text', async () => {
    await tableComponent.filterColumnByText({
      columnName: 'Phone Number',
      filterText: '14155235557',
      filterMode: 'Not equal to',
    });
    registrationName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    expect(registrationName).toBe('Gemma Houtenbos');
    await tableComponent.validateWaitForTableRowCount({ expectedRowCount: 3 });
  });
});
