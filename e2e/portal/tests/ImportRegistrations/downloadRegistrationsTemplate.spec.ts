import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProjectPV from '@121-service/src/seed-data/project/project-nlrc-pv.json';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[29364] Download template for import registrations', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);

  const projectTitle = NLRCProjectPV.titlePortal.en;

  await test.step('Select project', async () => {
    await registrationsPage.selectProject(projectTitle);
  });

  await test.step('Export import template and validate CSV files columns', async () => {
    await registrationsPage.assertImportTemplateForPvProject();
  });
});
