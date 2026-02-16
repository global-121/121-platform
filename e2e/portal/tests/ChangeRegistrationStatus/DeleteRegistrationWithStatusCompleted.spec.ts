import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Deleted" successfully. The status change can take up to a minute to process.';

// Arrange
test.beforeEach(async ({ page, resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPvMaxPayment],
    programId: programIdPV,
  });

  const accessToken = await getAccessToken();
  await doPayment({
    programId: programIdPV,
    transferValue: 25,
    referenceIds: [],
    accessToken,
  });

  await page.goto(`/en-GB/program/${programIdPV}/registrations`);
});

test('Delete registration with status "Completed"', async ({
  registrationsPage,
  tableComponent,
}) => {
  // Act
  await test.step('Delete registration with status "Completed"', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPvMaxPayment.fullName,
      status: 'Delete',
    });
    await registrationsPage.validateToastMessageAndClose(toastMessage);
  });
  // Assert
  await test.step('Validate registration was deleted successfully', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Completed',
    });
    await tableComponent.assertEmptyTableState();
  });
});
