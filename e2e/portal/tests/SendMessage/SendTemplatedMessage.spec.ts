import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const sendingMessageToast =
  'Closing this notification will not cancel message sending.';
const englishMessageTemplate =
  'This is a message from the Red Cross.\n\nThanks for registering. From now on you will receive an Albert Heijn voucher via WhatsApp every Tuesday. You will receive the vouchers as long as you are on the list of .\n\nThe Red Cross can also provide you with information about, for example, medical assistance, food or safety. Check out our website:\n\nhttps://helpfulinformation.redcross.nl/\n\nor ask your question via WhatsApp:\n\nhttps://wa.me/3197010286964';
const dutchMessageTemplate =
  'Dit is een bericht van het Rode Kruis.\n\nBedankt voor je inschrijving. Je ontvangt vanaf nu elke dinsdag een Albert Heijn waardebon via WhatsApp. Je ontvangt de waardebonnen zo lang je op de lijst staat van .\n\nHet Rode Kruis kan je ook informatie geven over bijvoorbeeld medische hulp, voedsel of veiligheid. Kijk op onze website:\n\nhttps://helpfulinformation.redcross.nl/\n\nof stel je vraag via WhatsApp:\n\nhttps://wa.me/3197010286964';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Send templated message', async ({ page }) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);
  const activityLog = new RegistrationActivityLogPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Select program', async () => {
    await basePage.selectProgram(projectTitle);
  });

  await test.step('Send templated message', async () => {
    await registrations.selectAllRegistrations();
    await registrations.selectBulkAction('Message');
    await registrations.selectTemplatedMessage('Include');
    await registrations.clickContinueToPreview();
    await registrations.validateMessagePresent(
      'This is a message from the Red Cross.',
    );
    await registrations.sendMessage();

    await registrations.validateToastMessage(sendingMessageToast);
    // Validate English message
    await registrations.goToRegistrationByName({
      registrationName: 'Jack Strong',
    });
    await activityLog.validateLastMessageSent(englishMessageTemplate);
    // Validate Dutch message
    await page.goto('/');
    await basePage.selectProgram(projectTitle);
    await registrations.goToRegistrationByName({
      registrationName: 'Gemma Houtenbos',
    });
    await activityLog.validateLastMessageSent(dutchMessageTemplate);
  });
});
