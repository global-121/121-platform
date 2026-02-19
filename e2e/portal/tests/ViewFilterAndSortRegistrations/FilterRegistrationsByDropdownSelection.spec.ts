import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Paused" successfully. The status change can take up to a minute to process.';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
    seedWithStatus: RegistrationStatusEnum.included,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('Filter registrations by dropdown selection', async ({
  registrationsPage,
  tableComponent,
}) => {
  const registrations = registrationsPage;
  // Act & Assert
  await test.step('Filter Status column with "New" selection', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Status',
      selection: 'New',
    });
    await tableComponent.assertEmptyTableState();
    await tableComponent.clearAllFilters();
  });

  await test.step('Update status and filter by "Paused" status', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationsPV[0].fullName,
      status: 'Pause',
    });
    await registrations.validateToastMessageAndClose(toastMessage);
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Status',
      selection: 'Paused',
    });
    await registrations.validateStatusOfFirstRegistration({
      status: 'Paused',
    });
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Duplicates column by "Unique" selection', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Duplicates',
      selection: 'Unique',
    });
    await tableComponent.validateAllRecordsCount(2);
    await tableComponent.clearAllFilters();
  });

  await test.step('Filter Duplicates column by "Duplicate" selection', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Duplicates',
      selection: 'Duplicate',
    });
    await tableComponent.validateAllRecordsCount(2);
  });
});
