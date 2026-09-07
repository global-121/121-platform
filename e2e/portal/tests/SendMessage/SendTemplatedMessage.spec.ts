import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.describe('Send templated message', () => {
  test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  test('Send templated message', async ({
    page,
    registrationsPage,
    registrationActivityLogPage,
  }) => {
    const messageResult =
      'This is a message from the Red Cross.\n\nThanks for registering. From now on you will receive an Albert Heijn voucher via WhatsApp every Tuesday. You will receive the vouchers as long as you are on the list of .\n\nThe Red Cross can also provide you with information about, for example, medical assistance, food or safety. Check out our website:\n\nhttps://helpfulinformation.redcross.nl/\n\nor ask your question via WhatsApp:\n\nhttps://wa.me/3197010286964';

    await test.step('Select registration', async () => {
      await registrationsPage.selectAllRegistrations();
      await registrationsPage.selectBulkAction('Message');
    });

    await test.step('Send message', async () => {
      await registrationsPage.selectTemplatedMessage('Include');
      await registrationsPage.clickContinueToPreview();
      await registrationsPage.validateMessagePreview(messageResult);
      await registrationsPage.sendMessage();
      await registrationsPage.validateToastMessageAndClose(
        'Closing this notification will not cancel message sending.',
      );
      await page.waitForTimeout(900); // Sending the message takes time;
    });

    await test.step('Verify message', async () => {
      const registrationEnFullName = 'Jack Strong';
      const registrationNlFullName = 'Gemma Houtenbos';

      // Prepare a clean slate from any previous tries/actions on the page
      await registrationActivityLogPage.resetTableStateStorage();

      // Validate English message
      await registrationsPage.goto(`/program/${programIdPV}/registrations`);
      await registrationsPage.goToRegistrationByName({
        registrationName: registrationEnFullName,
      });
      await expect(registrationActivityLogPage.registrationTitle).toContainText(
        registrationEnFullName,
      );

      await registrationActivityLogPage.validateLastMessageSent(messageResult);

      // Prepare a clean slate from any previous tries/actions on ANY activity-log-page page
      await registrationActivityLogPage.resetTableStateStorage();

      // Validate Dutch message
      await registrationsPage.goto(`/program/${programIdPV}/registrations`);
      await registrationsPage.goToRegistrationByName({
        registrationName: registrationNlFullName,
      });
      await expect(registrationActivityLogPage.registrationTitle).toContainText(
        registrationNlFullName,
      );

      await registrationActivityLogPage.validateLastMessageSent(
        'Dit is een bericht van het Rode Kruis.\n\nBedankt voor je inschrijving. Je ontvangt vanaf nu elke dinsdag een Albert Heijn waardebon via WhatsApp. Je ontvangt de waardebonnen zo lang je op de lijst staat van .\n\nHet Rode Kruis kan je ook informatie geven over bijvoorbeeld medische hulp, voedsel of veiligheid. Kijk op onze website:\n\nhttps://helpfulinformation.redcross.nl/\n\nof stel je vraag via WhatsApp:\n\nhttps://wa.me/3197010286964',
      );
    });
  });
});
