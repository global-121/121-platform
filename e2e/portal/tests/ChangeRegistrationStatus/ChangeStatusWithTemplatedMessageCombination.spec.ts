import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Included" successfully. The status change can take up to a minute to process.';

test.describe('Change status of registration with and without templated message', () => {
  test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      seedWithStatus: RegistrationStatusEnum.new,
      registrations: [registrationPV5, registrationPV6],
      programId: programIdPV,
      navigateToPage: `/en-GB/program/${programIdPV}/registrations`,
    });
  });

  // Act
  test('Change status of registration with templated message', async ({
    page,
    registrationsPage,
    tableComponent,
  }) => {
    await test.step('Change status of first selected registration and send templated message', async () => {
      await tableComponent.changeRegistrationStatusByNameWithOptions({
        registrationName: registrationPV5.fullName,
        status: 'Include',
        sendMessage: true,
        sendTemplatedMessage: true,
      });
      await page.waitForTimeout(1000);
      await registrationsPage.validateToastMessageAndClose(toastMessage);
    });

    await test.step('Find and validate templated message', async () => {
      await registrationsPage.goToRegistrationByName({
        registrationName: registrationPV5.fullName,
      });
      await tableComponent.validateMessageActivityByTypeAndText({
        notificationType: 'Inclusion',
      });
    });
  });

  test('Change status of registration without templated message', async ({
    page,
    registrationsPage,
    tableComponent,
  }) => {
    // Act
    await test.step('Change status of first selected registration without templated message', async () => {
      await tableComponent.changeRegistrationStatusByNameWithOptions({
        registrationName: registrationPV6.fullName,
        status: 'Include',
        sendMessage: false,
      });
      await page.waitForTimeout(1000);
      await registrationsPage.validateToastMessageAndClose(toastMessage);
    });

    await test.step('Find and validate templated message not present', async () => {
      await registrationsPage.goToRegistrationByName({
        registrationName: registrationPV6.fullName,
      });
      await tableComponent.validateActivityNotPresentByType('Inclusion');
    });
  });
});
