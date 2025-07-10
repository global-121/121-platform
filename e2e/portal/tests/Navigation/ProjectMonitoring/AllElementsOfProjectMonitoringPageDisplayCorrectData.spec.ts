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
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

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

  const projectTitle = 'NLRC OCW program';

  await test.step('Navigate to project`s monitoring page', async () => {
    await basePage.selectProgram(projectTitle);
    await projectMonitoring.navigateToProgramPage('Monitoring');
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

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Navigate to project`s monitoring page', async () => {
    await basePage.selectProgram(projectTitle);
    await projectMonitoring.navigateToProgramPage('Monitoring');
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
