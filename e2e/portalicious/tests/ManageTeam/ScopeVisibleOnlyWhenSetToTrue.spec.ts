import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import ProjectTeam from '@121-e2e/portalicious/pages/ProjectTeam';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[29761] "Scope" column should only be loaded when "enableScope": is set to true under the program configuration', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const manageTeam = new ProjectTeam(page);
  const projectTitle1 = 'NLRC Direct Digital Aid Program (PV)';
  const projectTitle2 = 'NLRC OCW program';

  await test.step('Navigate to Manage team in PV program and validate scope column is hidden per configuration', async () => {
    await basePage.selectProgram(projectTitle1);
    await basePage.navigateToProgramPage('Team');
    await page.waitForURL('/en/project/2/team');
    await manageTeam.validateScopeColumnIsVisible();
  });

  await test.step('Navigate to Manage team in OCW program and validate scope column is hidden per configuration', async () => {
    await page.goto('/');
    await basePage.selectProgram(projectTitle2);
    await basePage.navigateToProgramPage('Team');
    await page.waitForURL('/en/project/3/team');
    await manageTeam.validateScopeColumnIsHidden();
  });
});
