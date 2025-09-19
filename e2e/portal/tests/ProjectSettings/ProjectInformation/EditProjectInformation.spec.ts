import test from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectSettings from '@121-e2e/portal/pages/ProjectSettings';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const currentDate = new Date();
const todaysDate = new Date(currentDate);
todaysDate.setDate(currentDate.getDate());
const futureDate = new Date(currentDate);
futureDate.setDate(currentDate.getDate() + 1);

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

  const projectInfo = {
    name: 'TUiR Warta',
    description: 'TUiR Warta description',
    dateRange: { start: todaysDate, end: futureDate },
    location: 'Polen',
    targetRegistrations: '2000',
  };

  // Act
  await test.step('Navigate to project settings', async () => {
    await registrations.navigateToProgramPage('Settings');
  });

  await test.step('Select: Project Information', async () => {
    await projectSettings.selectSettings('Project information');
  });

  await test.step('Edit basic information', async () => {
    await projectSettings.clickEditBasicInformationButton();
    await projectSettings.editInformationFieldByLabel(
      'Project name',
      projectInfo.name,
    );
    await projectSettings.editInformationFieldByLabel(
      'Project description',
      projectInfo.description,
    );
    await projectSettings.selectDateRange({
      dateRange: projectInfo.dateRange,
    });
    await projectSettings.editInformationFieldByLabel(
      'Location',
      projectInfo.location,
    );
    await projectSettings.editInformationFieldByLabel(
      '*Target registrations',
      projectInfo.targetRegistrations,
    );
    await projectSettings.saveChanges();
  });
});
