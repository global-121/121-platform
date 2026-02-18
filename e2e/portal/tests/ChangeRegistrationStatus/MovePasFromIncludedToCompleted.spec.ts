import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvMaxPayment,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPvMaxPayment],
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
    seedWithStatus: RegistrationStatusEnum.included,
  });
});

test('Move PA(s) from status "Included" to "Completed"', async ({
  registrationsPage,
  tableComponent,
}) => {
  const accessToken = await getAccessToken();
  const paymentReferenceIds = [registrationPvMaxPayment.referenceId];
  // Act
  await test.step('Validate the status of the registration', async () => {
    await registrationsPage.validateStatusOfFirstRegistration({
      status: 'Included',
    });
  });

  await test.step('Change status of registrations to "Completed" with doing a payment', async () => {
    await doPayment({
      programId: programIdPV,
      transferValue: 100,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    // Wait for payment transactions to complete
    await waitForPaymentAndTransactionsToComplete({
      programId: programIdPV,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.waiting,
        TransactionStatusEnum.error,
      ],
    });
  });

  await test.step('Search for the registration with status "Completed"', async () => {
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Registration Status',
      selection: 'Completed',
    });
  });

  // Assert
  await test.step('Validate the status of the registration', async () => {
    await registrationsPage.validateStatusOfFirstRegistration({
      status: 'Completed',
    });
  });
});
