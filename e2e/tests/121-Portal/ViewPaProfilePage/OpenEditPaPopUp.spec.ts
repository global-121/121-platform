import { test } from '@playwright/test';

import { AppRoutes } from '@121-portal/src/app/app-routes.enum';
import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const pageTitle = englishTranslations['registration-details'].pageTitle;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[27493] Open the edit PA popup', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should open PAs for registration', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
  });

  await test.step('Should open first uploaded PA', async () => {
    await table.openFspProfile({ shouldIncludeVisa: true });
  });

  await test.step('Should open PA profile and open edit pop-up', async () => {
    await registration.validateHeaderToContainText(pageTitle);
    await registration.openEditPaPopUp();
    await registration.validateEditPaPopUpOpened();
  });
});
