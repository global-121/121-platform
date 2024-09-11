import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import ProjectTeam from '@121-e2e/portalicious/pages/ProjectTeam';

const expectedAssignedUsers = ['admin@example.org', 'cva-officer@example.org'];
const userSearchPhrase = 'cva-officer';
const userFullEmail = 'cva-officer@example.org';
const userRole = 'Only CREATE registrations';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.oneAdmin);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[29759] Assign successfully roles to a user ', async ({ page }) => {
  const basePage = new BasePage(page);
  const manageTeam = new ProjectTeam(page);
  const projectTitle = 'Cash program Warsaw';

  await test.step('Select program and navigate to Manage team', async () => {
    await basePage.selectProgram(projectTitle);
    await basePage.navigateToProgramPage('Team');
  });

  await test.step('Validate available system users are visible', async () => {
    await manageTeam.openAddUserForm();
    await manageTeam.addUserToTeam({
      userSearchPhrase,
      userEmail: userFullEmail,
      role: userRole,
    });
    await manageTeam.validateToastMessage('User added');
    await manageTeam.validateAssignedTeamMembers(expectedAssignedUsers);
  });
});
