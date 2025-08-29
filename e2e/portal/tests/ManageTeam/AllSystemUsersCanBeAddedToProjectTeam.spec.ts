import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  removeProjectAssignment,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';

import BasePage from '../../pages/BasePage';
import ProjectTeam from '../../pages/ProjectTeam';

const expectedAssignedUsers = ['admin@example.org'];
const expectedAvailablesystemUsers = [
  'project-admin@example.org',
  'view-user@example.org',
  'kobo+registration_country@example.org',
  'kobo+validation_country@example.org',
  'cva-manager@example.org',
  'cva-officer@example.org',
  'finance-manager@example.org',
  'finance-officer@example.org',
  'view-no-pii@example.org',
];
const projectId = 2;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);
  // remove assignments of all users except admin again, to create the context for this test
  const accessToken = await getAccessToken();
  for (let userId = 2; userId <= 10; userId++) {
    await removeProjectAssignment(projectId, userId, accessToken);
  }

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[29758] All system-users are available to be added to a "project team"', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const manageTeam = new ProjectTeam(page);
  const projectTitle = 'Cash project Westeros';
  await test.step('Select project and navigate to Manage team', async () => {
    await basePage.selectProject(projectTitle);
    await basePage.navigateToProjectPage('Team');
  });
  await test.step('Validate assigned users are visible', async () => {
    await manageTeam.validateAssignedTeamMembers(expectedAssignedUsers);
  });
  await test.step('Validate available system users are visible', async () => {
    await manageTeam.openAddUserForm();
    await manageTeam.validateAvailableSystemUsers(expectedAvailablesystemUsers);
  });
});
