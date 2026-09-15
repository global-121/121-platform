import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitForMessagesToComplete } from '@121-service/test/helpers/program.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV8,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.describe('Send custom message', () => {
  test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  test('Send custom message', async ({
    registrationsPage,
    registrationActivityLogPage,
  }) => {
    const registrationFullName = registrationPV8.fullName;
    const customMessageContent =
      'This is a custom message from the Red Cross for: {{fullName}}';
    const customMessageResult = `This is a custom message from the Red Cross for: ${registrationFullName}`;

    await test.step('Select registration', async () => {
      await registrationsPage.selectAllRegistrations();
      await registrationsPage.selectBulkAction('Message');
    });

    await test.step('Send message', async () => {
      await registrationsPage.selectCustomMessage();
      await registrationsPage.typeCustomMessage(customMessageContent);
      await registrationsPage.clickContinueToPreview();
      await registrationsPage.validateMessagePreview(customMessageResult);
      await registrationsPage.sendMessage();
      await registrationsPage.validateToastMessageAndClose(
        'Closing this notification will not cancel message sending.',
      );
    });

    await test.step('Verify message', async () => {
      await waitForMessagesToComplete({
        programId: programIdPV,
        referenceIds: [registrationPV8.referenceId],
        accessToken: await getAccessToken(),
        // Match on the exact body, since "custom" content type is too common on its own to prove this specific message completed
        expectedMessageAttribute: {
          key: 'body',
          values: [customMessageResult],
        },
      });

      // Prepare a clean slate from any previous tries/actions on the page
      await registrationActivityLogPage.resetTableStateStorage();

      await registrationsPage.goto(`/program/${programIdPV}/registrations`);

      await registrationsPage.goToRegistrationByName({
        registrationName: registrationFullName,
      });
      await expect(registrationActivityLogPage.registrationTitle).toContainText(
        registrationFullName,
      );

      await registrationActivityLogPage.validateLastMessageSent(
        customMessageResult,
      );
    });
  });
});
