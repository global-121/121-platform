import test from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectSettings from '@121-e2e/portal/pages/ProjectSettings';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  await getAccessToken();

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
  // Navigate to program
  await loginPage.selectProgram('NLRC OCW program');
});
test('[38155] Edit Project Information', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const projectSettings = new ProjectSettings(page);

  // Act
  await test.step('Navigate to project settings', async () => {
    await registrations.navigateToProgramPage('Settings');
  });

  await test.step('Select: Project Information', async () => {
    await projectSettings.selectSettings('Project information');
  });

  await test.step('Edit basic information', async () => {
    console.log('Skipping - not implemented yet');
  });
});
