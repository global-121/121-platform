import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';
import TableComponent from '@121-e2e/portalicious/pages/TableComponent';

const sendingMessageToast =
  'Closing this notification will not cancel message sending.';
const includeMessageTemplate =
  'This is a message from the Red Cross. Thanks for registering. From now on you will receive an Albert Heijn voucher via WhatsApp every Tuesday. You will receive the vouchers as long as you are on the list of . The Red Cross can also provide you with information about, for example, medical assistance, food or safety. Check out our website: https://helpfulinformation.redcross.nl/ or ask your question via WhatsApp: https://wa.me/3197010286964';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;
  const pvProgramId = programIdPV;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, pvProgramId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[31076] Send templated message', async ({ page }) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);
  const table = new TableComponent(page);

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
    await table.selectRandomRegistration();
    await registrations.validateLastMessageSent(includeMessageTemplate);
  });
});
