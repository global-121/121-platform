import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import ProjectTeam from '@121-e2e/portalicious/pages/ProjectTeam';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { test } from '@playwright/test';

const expectedInitialAssignedUsers = [
  'admin@example.org',
  'program-admin@example.org',
  'view-user@example.org',
  'kobo-user@example.org',
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
  await resetDB(SeedScript.test);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[29760] Users should be removable from "project team"', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const manageTeam = new ProjectTeam(page);
  const projectTitle = 'Cash program Westeros';

  await test.step('Select program and navigate to Manage team', async () => {
    await basePage.selectProgram(projectTitle);
    await basePage.navigateToProgramPage('Team');
  });

  await test.step('Validate assigned users are visible', async () => {
    await manageTeam.validateAssignedTeamMembers(expectedInitialAssignedUsers);
  });

  await test.step('Validate available system users are visible', async () => {
    await manageTeam.removeUserFromTeam({
      userEmail: userToRemove,
    });
    await manageTeam.validateToastMessage('User removed');
    await manageTeam.validateAssignedTeamMembers(expectedFinalAssignedUsers);
  });
});
