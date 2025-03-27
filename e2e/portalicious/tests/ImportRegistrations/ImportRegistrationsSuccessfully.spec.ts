import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

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

test('[29364] Download template for import registrations', async ({ page }) => {
  const registrations = new RegistrationsPage(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrations.selectProgram(projectTitle);
  });

  await test.step('Export import template and validate CSV files columns', async () => {
    await registrations.clickImportButton();
    await registrations.validateDownloadedTemplate();
  });
});
