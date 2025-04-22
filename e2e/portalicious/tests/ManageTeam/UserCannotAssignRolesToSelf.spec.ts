import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  removeProgramAssignment,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import ProjectTeam from '@121-e2e/portalicious/pages/ProjectTeam';

const programId = 2;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple);
  // remove assignments of all users except admin again, to create the context for this test
  const accessToken = await getAccessToken();
  for (let userId = 2; userId <= 10; userId++) {
    await removeProgramAssignment(programId, userId, accessToken);
  }

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('User cannot assign role to self', async ({ page }) => {
  const basePage = new BasePage(page);
  const manageTeam = new ProjectTeam(page);
  const projectTitle = 'Cash program Westeros';

  await test.step('Select program and navigate to Manage team', async () => {
    await basePage.selectProgram(projectTitle);
    await basePage.navigateToProgramPage('Team');
  });

  await test.step('Check if warning appears that user cannot edit their own roles', async () => {
    await manageTeam.editUser({
      userEmail: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN!,
    });
    // Expect text: Users cannot change their own roles
    await expect(
      page.getByText('Users cannot change their own roles'),
    ).toBeVisible();
  });
});
