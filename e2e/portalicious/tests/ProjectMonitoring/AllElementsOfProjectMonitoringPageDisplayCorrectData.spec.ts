import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portalicious/pages/ProjectMonitoringPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[30326] All elements of Monitoring page display correct data', async ({
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
    await projectMonitoring.assertMonitoringTabElements();
    await projectMonitoring.assertValuesInMonitoringTab({
      peopleIncluded: 4,
      peopleRegistered: 4,
    });
  });
});
