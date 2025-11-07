import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectTeamPage from '@121-e2e/portal/pages/ProjectTeamPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('"Scope" column should only be loaded when "enableScope": is set to true under the program configuration', async ({
  page,
}) => {
  const manageTeam = new ProjectTeamPage(page);

  await test.step('Navigate to Manage team in PV program and validate scope column is hidden per configuration', async () => {
    await page.goto('/en-GB/project/2/settings/team');
    await manageTeam.validateScopeColumnIsVisible();
  });

  await test.step('Navigate to Manage team in OCW program and validate scope column is hidden per configuration', async () => {
    await page.goto('/en-GB/project/3/settings/team');
    await manageTeam.validateScopeColumnIsHidden();
  });
});
