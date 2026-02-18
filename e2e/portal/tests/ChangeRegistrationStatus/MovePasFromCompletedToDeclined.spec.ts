import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Declined" successfully. The status change can take up to a minute to process.';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPvMaxPayment],
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
    seedWithStatus: RegistrationStatusEnum.included,
  });
});

test('Move PA(s) from status "Completed" to "Declined"', async ({
  registrationsPage,
  tableComponent,
}) => {
  const accessToken = await getAccessToken();
  // Act
  await test.step('Validate the status of the registration', async () => {
    await registrationsPage.validateStatusOfFirstRegistration({
      status: 'Included',
    });
  });

  await test.step('Change status of registration to "Completed" with doing a payment', async () => {
    await doPayment({
      programId: programIdPV,
      transferValue: 25,
      referenceIds: [registrationPvMaxPayment.referenceId],
      accessToken,
    });
  });

  await test.step('Change status of registration to "Declined"', async () => {
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPvMaxPayment.fullName,
      status: 'Decline',
    });
    await registrationsPage.validateToastMessageAndClose(toastMessage);
  });

  // Assert
  await test.step('Validate status change', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Declined',
    });
    await registrationsPage.validateStatusOfFirstRegistration({
      status: 'Declined',
    });
  });
});
