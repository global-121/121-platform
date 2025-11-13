import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Send custom message', async ({ page }) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);
  const activityLog = new RegistrationActivityLogPage(page);

  const programTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Select program', async () => {
    await basePage.selectProgram(programTitle);
  });

  await test.step('Send custom message', async () => {
    const registrationFullName =
      await registrations.getFirstRegistrationNameFromTable();
    if (!registrationFullName) {
      throw new Error('Registration full name is undefined');
    }
    const customMessageText =
      'This is {{fullName}} custom message from the Red Cross.';
    const customMessagePreview = `This is ${registrationFullName} custom message from the Red Cross.`;
    const sendingMessageToast =
      'Closing this notification will not cancel message sending.';

    await registrations.selectAllRegistrations();
    await registrations.selectBulkAction('Message');
    await registrations.selectCustomMessage();
    await registrations.typeCustomMessage(customMessageText);
    await registrations.clickContinueToPreview();
    await registrations.validateMessagePresent(customMessagePreview);
    await registrations.sendMessage();

    await registrations.validateToastMessage(sendingMessageToast);
    await registrations.goToRegistrationByName({
      registrationName: registrationFullName,
    });

    await activityLog.validateLastMessageSent(customMessagePreview);
  });
});
