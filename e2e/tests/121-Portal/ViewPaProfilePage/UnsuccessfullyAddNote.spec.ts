import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { AppRoutes } from '../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const ok = englishTranslations.common.ok;
const pageTitle = englishTranslations['registration-details'].pageTitle;
const actions =
  englishTranslations['registration-details']['activity-overview'].actions;
const addNote =
  englishTranslations['registration-details']['activity-overview'].action[
    'add-note'
  ];

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

test('[27500] Unsuccessfully add note', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should display correct amount of running projects and navigate to PA table', async () => {
    await homePage.validateNumberOfActivePrograms(2);
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
  });

  await test.step('Should validate first row with uploaded PAs', async () => {
    await table.openFspProfile({ shouldIncludeVisa: true });
  });

  await test.step('Should validate PA profile opened succesfully, adds note without content and validate that "ok" button is disabled', async () => {
    await registration.validateHeaderToContainText(pageTitle);
    await registration.addNote(actions, addNote);
    await registration.addEmptyNote({
      buttonName: ok,
    });
  });
});
