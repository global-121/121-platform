import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portal/pages/ProjectMonitoringPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const projectIdOCW = 3;
  const OcwProjectId = projectIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProjectId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[30579] All elements of Monitoring page display correct data for OCW', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const projectMonitoring = new ProjectMonitoring(page);

  const projectTitle = 'NLRC OCW project';

  await test.step('Navigate to project`s monitoring page', async () => {
    await basePage.selectProject(projectTitle);
    await projectMonitoring.navigateToProjectPage('Monitoring');
  });

  await test.step('Check if all elements are displayed', async () => {
    await projectMonitoring.assertMonitoringTabElements({
      shouldHaveIframe: true,
    });
    await projectMonitoring.assertValuesInMonitoringTab({
      peopleIncluded: 5,
      peopleRegistered: 5,
    });
  });
});

test('[30326] All elements of Monitoring page display correct data for NLRC', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const projectMonitoring = new ProjectMonitoring(page);

  const projectTitle = 'NLRC Direct Digital Aid Project (PV)';

  await test.step('Navigate to project`s monitoring page', async () => {
    await basePage.selectProject(projectTitle);
    await projectMonitoring.navigateToProjectPage('Monitoring');
  });

  await test.step('Check if all elements are displayed', async () => {
    await projectMonitoring.assertMonitoringTabElements({
      shouldHaveIframe: false,
    });
    await projectMonitoring.assertValuesInMonitoringTab({
      peopleIncluded: 0,
      peopleRegistered: 0,
    });
  });
});
