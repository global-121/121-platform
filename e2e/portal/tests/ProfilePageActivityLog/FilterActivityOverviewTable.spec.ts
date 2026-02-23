import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  getRegistrationIdByReferenceId,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

let registrationId: number;
const paymentReferenceId = [registrationPV5.referenceId];

test.beforeAll(async ({ onlyResetAndSeedRegistrations }) => {
  await onlyResetAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
  });
});

test.beforeEach(async ({ page, login, accessToken }) => {
  // Arrange once because tests don't mutate backend state.
  await login();

  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });

  await doPayment({
    programId: 2,
    transferValue: 100,
    referenceIds: paymentReferenceId,
    accessToken,
  });

  await updateRegistration(
    2,
    registrationPV5.referenceId,
    {
      maxPayments: '2',
    },
    'automated test',
    accessToken,
  );

  await page.goto(
    `en-GB/program/${programIdPV}/registrations/${registrationId}`,
  );
});

['Transaction', 'Message', 'Data change', 'Status update'].forEach(
  (activity) => {
    test(`Filter activity overview table by  ${activity}`, async ({
      tableComponent,
    }) => {
      // Act
      await test.step(`Filter activity log on "${activity}".`, async () => {
        await tableComponent.filterColumnByDropDownSelection({
          columnName: 'Activity',
          selection: activity,
        });
      });

      // Assert
      await test.step(`Validating whether "${activity}" is visible.`, async () => {
        await tableComponent.validateFirstLogActivity(activity);
      });
    });
  },
);
