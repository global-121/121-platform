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
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[27411] Open PA profile page', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should display correct amount of runnig projects and open PAs for registration', async () => {
    await homePage.validateNumberOfActivePrograms(2);
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
  });

  await test.step('Should validate first row with uploaded PAs', async () => {
    await table.verifiyProfilePersonalnformationTableLeft(1, {
      personAffected: 'PA #1',
      firstName: undefined,
      lastName: undefined,
      phoneNumber: undefined,
      status: undefined,
    });
    await table.clickOnPaNumber(1);
  });

  await test.step('Should validate PA profile opened succesfully', async () => {
    await registration.validateHeaderToContainText(
      englishTranslations['registration-details'].pageTitle,
    );
  });
});
