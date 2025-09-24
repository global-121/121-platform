import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectTeamPage from '@121-e2e/portal/pages/ProjectTeamPage';

const expectedInitialAssignedUsers = [
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
const userToRemove = 'view-no-pii@example.org';
const expectedFinalAssignedUsers = expectedInitialAssignedUsers.filter(
  (email) => email !== userToRemove,
);

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[29760] Users should be removable from "project team"', async ({
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
    await manageTeam.validateAssignedTeamMembers(expectedInitialAssignedUsers);
  });

  await test.step('Validate available system users are visible', async () => {
    await manageTeam.enableEditMode();
    await manageTeam.removeUserFromTeam({
      userEmail: userToRemove,
    });
    await manageTeam.validateToastMessage('User removed');
    await manageTeam.validateAssignedTeamMembers(expectedFinalAssignedUsers);
  });
});
