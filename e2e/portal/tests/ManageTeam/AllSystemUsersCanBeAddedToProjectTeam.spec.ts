import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  removeProgramAssignment,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectTeamPage from '@121-e2e/portal/pages/ProjectTeamPage';

const expectedAssignedUsers = ['admin@example.org'];
const expectedAvailablesystemUsers = [
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
const programId = 2;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);
  // remove assignments of all users except admin again, to create the context for this test
  const accessToken = await getAccessToken();
  for (let userId = 2; userId <= 10; userId++) {
    await removeProgramAssignment(programId, userId, accessToken);
  }

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('All system-users are available to be added to a "project team"', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const manageTeam = new ProjectTeamPage(page);
  const projectTitle = 'Cash program Westeros';
  await test.step('Select program and navigate to Manage team', async () => {
    await basePage.selectProgram(projectTitle);
    await basePage.navigateToProgramSettingsPage('Project team');
  });
  await test.step('Validate assigned users are visible', async () => {
    await manageTeam.validateAssignedTeamMembers(expectedAssignedUsers);
  });
  await test.step('Validate available system users are visible', async () => {
    await manageTeam.enableEditMode();
    await manageTeam.openAddUserForm();
    await manageTeam.validateAvailableSystemUsers(expectedAvailablesystemUsers);
  });
});
