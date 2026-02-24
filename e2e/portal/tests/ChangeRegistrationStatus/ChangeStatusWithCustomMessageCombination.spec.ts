import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Declined" successfully. The status change can take up to a minute to process.';
const customMessage =
  'Test custom message to change the status of registration';

test.describe('Change status of registration with and without templated message', () => {
  test.beforeAll(async ({ onlyResetAndSeedRegistrations }) => {
    await onlyResetAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationPV5, registrationPV6],
      programId: programIdPV,
    });
  });

  test.beforeEach(async ({ page, login }) => {
    await login();
    await page.goto(`en-GB/program/${programIdPV}/registrations`);
  });
  // Act
  test('Change status of registration with custom message', async ({
    page,
    registrationsPage,
    tableComponent,
  }) => {
    await test.step('Change status of first selected registration and write a custom message', async () => {
      await tableComponent.changeRegistrationStatusByNameWithOptions({
        registrationName: registrationPV5.fullName,
        status: 'Decline',
        sendMessage: true,
        sendCustomMessage: true,
        customMessage,
      });
      await page.waitForTimeout(1000);
      await registrationsPage.validateToastMessageAndClose(toastMessage);
    });

    await test.step('Find and validate custom message', async () => {
      await registrationsPage.goToRegistrationByName({
        registrationName: registrationPV5.fullName,
      });
      await tableComponent.validateMessageActivityByTypeAndText({
        notificationType: 'Custom message',
      });
    });
  });

  test('Change status of registration without custom message', async ({
    page,
    registrationsPage,
    tableComponent,
  }) => {
    await test.step('Change status of first selected registration and write a custom message', async () => {
      await tableComponent.changeRegistrationStatusByNameWithOptions({
        registrationName: registrationPV6.fullName,
        status: 'Decline',
        sendMessage: false,
      });
      await page.waitForTimeout(1000);
      await registrationsPage.validateToastMessageAndClose(toastMessage);
    });

    await test.step('Find and validate custom message not present', async () => {
      await registrationsPage.goToRegistrationByName({
        registrationName: registrationPV6.fullName,
      });
      await tableComponent.validateActivityNotPresentByType('Custom message');
    });
  });
});
