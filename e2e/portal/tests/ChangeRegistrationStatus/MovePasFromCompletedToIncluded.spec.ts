import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import { updateRegistration } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Included" successfully. The status change can take up to a minute to process.';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPvMaxPayment],
    programId: programIdPV,
    navigateToPage: `/en-GB/program/${programIdPV}/registrations`,
    seedWithStatus: RegistrationStatusEnum.included,
  });

  // Make payment to change status to "Completed"
  const accessToken = await getAccessToken();
  await doPayment({
    programId: programIdPV,
    transferValue: 25,
    referenceIds: [],
    accessToken,
  });
});

test('Move PA(s) from status "Completed" to "Included"', async ({
  registrationsPage,
  tableComponent,
}) => {
  const accessToken = await getAccessToken();
  // Act
  await test.step('Raise amount of max payments for the registration', async () => {
    await updateRegistration(
      programIdPV,
      registrationPvMaxPayment.referenceId,
      {
        maxPayments: '2',
      },
      'automated test',
      accessToken,
    );
  });

  await test.step('Change status of registration to "Included"', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPvMaxPayment.fullName,
      status: 'Include',
    });
    await registrationsPage.validateToastMessageAndClose(toastMessage);
  });

  // Assert
  await test.step('Validate status change', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Included',
    });
    await registrationsPage.validateStatusOfFirstRegistration({
      status: 'Included',
    });
  });
});
