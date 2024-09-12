import { test } from '@playwright/test';

import { AppRoutes } from '@121-portal/src/app/app-routes.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import TableModule from '@121-e2e/pages/Table/TableModule';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_VIEW_WITHOUT_PII,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_VIEW_WITHOUT_PII,
  );
});

test('[28036] No permission to view information', async ({ page }) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
  });

  await test.step('Validate information icons are not available in the table', async () => {
    await table.validateNoInformationButtonIsPresent();
  });
});
