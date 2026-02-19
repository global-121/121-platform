import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Deleted" successfully. The status change can take up to a minute to process.';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
    seedWithStatus: RegistrationStatusEnum.new,
  });
});

test('Delete registration with status "New"', async ({
  registrationsPage,
  tableComponent,
}) => {
  // Act
  await test.step('Delete registration with status "New"', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPV5.fullName,
      status: 'Delete',
    });
    await registrationsPage.validateToastMessageAndClose(toastMessage);
  });
  // Assert
  await test.step('Validate registration was deleted successfully', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'New',
    });
    await tableComponent.assertEmptyTableState();
  });
});
