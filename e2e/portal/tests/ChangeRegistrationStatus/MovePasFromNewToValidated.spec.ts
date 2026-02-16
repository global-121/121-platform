import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Validated" successfully. The status change can take up to a minute to process.';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
    navigateToPage: `/en-GB/program/${programIdPV}/registrations`,
    seedWithStatus: RegistrationStatusEnum.new,
  });
});

test('Move PA(s) from status "New" to "Validated"', async ({
  registrationsPage,
  tableComponent,
}) => {
  // Act
  await test.step('Change status of first selected registration to "Validated"', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPV5.fullName,
      status: 'Validate',
    });
    await registrationsPage.validateToastMessageAndClose(toastMessage);
  });

  await test.step('Search for the registration with status "Validated"', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Validated',
    });
  });

  // Assert
  await test.step('Validate the status of the registration', async () => {
    await registrationsPage.validateStatusOfFirstRegistration({
      status: 'Validated',
    });
  });
});
