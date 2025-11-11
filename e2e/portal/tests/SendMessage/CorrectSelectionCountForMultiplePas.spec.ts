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

test('Selection should show correct PA count for bulk action (Multiple PAs)', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Select program', async () => {
    await basePage.selectProgram(projectTitle);
  });

  await test.step('Apply bulk action on multiple PAs', async () => {
    // Select on to trigger the first count of bulk action
    await registrations.performActionOnRegistrationByName({
      registrationName: 'Gemma Houtenbos',
      action: 'Message',
    });
    await registrations.validateSendMessagePaCount(1);
    await registrations.cancelSendMessageBulkAction();
    // Select couple of PAs to trigger the second count of bulk action
    await registrations.selectMultipleRegistrations(2);
    await registrations.performActionWithRightClick('Message');
    await registrations.validateSendMessagePaCount(2);
  });
});
