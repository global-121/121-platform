import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Successfully Add Note', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  const activityLogPage = new RegistrationActivityLogPage(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(projectTitle);
  });

  await test.step('Go to registration', async () => {
    await registrationsPage.goToRegistrationByName({
      registrationName: registrationPV5.fullName,
    });
  });

  await test.step('Add note', async () => {
    await activityLogPage.initiateAction('Add note');
    await activityLogPage.fillNote('This is a test note');
    await tableComponent.validateActivityPresentByType({
      notificationType: 'Note',
      count: 1,
    });
  });
});
