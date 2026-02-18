import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import {
  customSharedFixture as test,
  expect,
} from '@121-e2e/portal/fixtures/fixture';

test('Registration table should clear row selections when filter criteria change', async ({
  tableComponent,
  resetDBAndSeedRegistrations,
}) => {
  await test.step('Setup and seed database', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  await test.step('should clear single row selection when applying a filter', async () => {
    await tableComponent.selectRowByName('Jan Janssen');
    expect(await tableComponent.getSelectedRowsCount()).toBe(1);
    await tableComponent.filterColumnByText({
      columnName: 'Name',
      filterText: 'Jan',
    });
    await tableComponent.validateAndWaitForSelectedRowsCount({
      expectedCount: 0,
    });
  });

  await test.step('should clear single row selection when removing a column filter', async () => {
    await tableComponent.selectRowByName('Jan Janssen');
    await tableComponent.validateAndWaitForSelectedRowsCount({
      expectedCount: 1,
    });
    await tableComponent.clearColumnFilter('Name');
    await tableComponent.validateAndWaitForSelectedRowsCount({
      expectedCount: 0,
    });
  });

  await test.step('should clear single row selection when clearing all filters', async () => {
    await tableComponent.filterColumnByText({
      columnName: 'Name',
      filterText: 'Jan',
    });
    await tableComponent.selectRowByName('Jan Janssen');
    await tableComponent.validateAndWaitForSelectedRowsCount({
      expectedCount: 1,
    });
    await tableComponent.clearAllFilters();
    await tableComponent.validateAndWaitForSelectedRowsCount({
      expectedCount: 0,
    });
  });

  await test.step('should clear all rows selection when applying a filter', async () => {
    await tableComponent.selectAll();
    await tableComponent.validateAndWaitForSelectedRowsCount({
      expectedCount: 4,
    });
    await tableComponent.filterColumnByText({
      columnName: 'Name',
      filterText: 'Jan',
    });
    await tableComponent.validateAndWaitForSelectedRowsCount({
      expectedCount: 0,
    });
  });
});
