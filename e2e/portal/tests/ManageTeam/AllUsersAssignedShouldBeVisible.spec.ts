import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProgramTeamPage from '@121-e2e/portal/pages/ProgramTeamPage';

const expectedAssignedUsers = [
  'admin@example.org',
  'program-admin@example.org',
  'view-user@example.org',
  'kobo+registration_country@example.org',
  'kobo+validation_country@example.org',
  'cva-manager@example.org',
  'cva-officer@example.org',
  'finance-manager@example.org',
  'finance-officer@example.org',
  'view-no-pii@example.org',
];

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('All users assigned to the program should be visible', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const manageTeam = new ProgramTeamPage(page);
  const programTitle = 'Cash program Westeros';

  await test.step('Select program and navigate to Manage team', async () => {
    await basePage.selectProgram(programTitle);
    await basePage.navigateToProgramSettingsPage('Program team');
  });

  await test.step('Validate assigned users are visible', async () => {
    await manageTeam.validateAssignedTeamMembers(expectedAssignedUsers);
  });
});
