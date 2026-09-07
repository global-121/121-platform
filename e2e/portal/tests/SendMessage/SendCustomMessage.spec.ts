import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
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
    page,
    registrationsPage,
    registrationActivityLogPage,
  }) => {
    const registrationFullName = 'Jack Strong';
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
      await page.waitForTimeout(900); // Sending the message takes time
    });

    await test.step('Verify message', async () => {
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
