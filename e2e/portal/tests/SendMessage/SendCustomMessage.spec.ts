import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('Send custom message', async ({
  resetDBAndSeedRegistrations,
  registrationsPage,
  registrationActivityLogPage,
}) => {
  await test.step('Setup', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  await test.step('Send custom message', async () => {
    const registrationFullName =
      await registrationsPage.getFirstRegistrationNameFromTable();
    if (!registrationFullName) {
      throw new Error('Registration full name is undefined');
    }
    const customMessageText =
      'This is {{fullName}} custom message from the Red Cross.';
    const customMessagePreview = `This is ${registrationFullName} custom message from the Red Cross.`;
    const sendingMessageToast =
      'Closing this notification will not cancel message sending.';

    await registrationsPage.selectAllRegistrations();
    await registrationsPage.selectBulkAction('Message');
    await registrationsPage.selectCustomMessage();
    await registrationsPage.typeCustomMessage(customMessageText);
    await registrationsPage.clickContinueToPreview();
    await registrationsPage.validateMessagePresent(customMessagePreview);
    await registrationsPage.sendMessage();

    await registrationsPage.validateToastMessage(sendingMessageToast);
    await registrationsPage.goToRegistrationByName({
      registrationName: registrationFullName,
    });

    await registrationActivityLogPage.validateLastMessageSent(
      customMessagePreview,
    );
  });
});
