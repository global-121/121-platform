import { expect, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  removeProgramAssignment,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectTeam from '@121-e2e/portal/pages/ProjectTeam';

const programId = 2;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);
  const accessToken = await getAccessToken();

  // remove assignments of all users except admin again, to create the context for this test
  for (let userId = 2; userId <= 10; userId++) {
    await removeProgramAssignment(programId, userId, accessToken);
  }

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('User cannot assign role to self', async ({ page }) => {
  const basePage = new BasePage(page);
  const manageTeam = new ProjectTeam(page);
  const projectTitle = 'Cash program Westeros';

  // Arrange
  await test.step('Select program and navigate to Manage team', async () => {
    await basePage.selectProgram(projectTitle);
    await basePage.navigateToProgramPage('Settings');
  });

  // Act
  await test.step('Check if warning appears that user cannot edit their own roles', async () => {
    await manageTeam.enableEditMode();
    await manageTeam.editUser({
      userEmail: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    });

    // Assert
    await expect(
      page.getByText('Users cannot change their own roles'),
    ).toBeVisible();
  });
});
