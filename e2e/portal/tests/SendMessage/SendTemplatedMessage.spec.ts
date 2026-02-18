import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const sendingMessageToast =
  'Closing this notification will not cancel message sending.';
const englishMessageTemplate =
  'This is a message from the Red Cross.\n\nThanks for registering. From now on you will receive an Albert Heijn voucher via WhatsApp every Tuesday. You will receive the vouchers as long as you are on the list of .\n\nThe Red Cross can also provide you with information about, for example, medical assistance, food or safety. Check out our website:\n\nhttps://helpfulinformation.redcross.nl/\n\nor ask your question via WhatsApp:\n\nhttps://wa.me/3197010286964';
const dutchMessageTemplate =
  'Dit is een bericht van het Rode Kruis.\n\nBedankt voor je inschrijving. Je ontvangt vanaf nu elke dinsdag een Albert Heijn waardebon via WhatsApp. Je ontvangt de waardebonnen zo lang je op de lijst staat van .\n\nHet Rode Kruis kan je ook informatie geven over bijvoorbeeld medische hulp, voedsel of veiligheid. Kijk op onze website:\n\nhttps://helpfulinformation.redcross.nl/\n\nof stel je vraag via WhatsApp:\n\nhttps://wa.me/3197010286964';

test('Send templated message', async ({
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

  await test.step('Send templated message', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.selectBulkAction('Message');
    await registrationsPage.selectTemplatedMessage('Include');
    await registrationsPage.clickContinueToPreview();
    await registrationsPage.validateMessagePresent(
      'This is a message from the Red Cross.',
    );
    await registrationsPage.sendMessage();

    await registrationsPage.validateToastMessage(sendingMessageToast);
    // Validate English message
    await registrationsPage.goToRegistrationByName({
      registrationName: 'Jack Strong',
    });
    await registrationActivityLogPage.validateLastMessageSent(
      englishMessageTemplate,
    );
    // Validate Dutch message
    await registrationsPage.goto(`/program/${programIdPV}/registrations`);
    await registrationsPage.goToRegistrationByName({
      registrationName: 'Gemma Houtenbos',
    });
    await registrationActivityLogPage.validateLastMessageSent(
      dutchMessageTemplate,
    );
  });
});
