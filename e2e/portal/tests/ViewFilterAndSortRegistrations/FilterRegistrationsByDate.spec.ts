import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

// Get current date information
const currentDate = new Date();
const day = currentDate.getDate();
const month = currentDate.getMonth();
const year = currentDate.getFullYear();
const formattedDate = `${year}-${month}-${day}`;

test('Filter registrations by Date selection', async ({
  tableComponent,
  resetDBAndSeedRegistrations,
}) => {
  await test.step('Setup and seed database', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      seedWithStatus: RegistrationStatusEnum.included,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });
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
