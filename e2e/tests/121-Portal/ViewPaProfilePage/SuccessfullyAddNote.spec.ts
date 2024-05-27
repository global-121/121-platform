import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import NLRCProgram from '@121-service/seed-data/program/program-nlrc-ocw.json';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';
import Helpers from '../../../pages/Helpers/Helpers';

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

test('[27499] Successfully add note', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);
  const helpers = new Helpers(page);

  await test.step('Should display correct amount of running projects and navigate to PA table', async () => {
    await homePage.validateNumberOfActivePrograms(2);
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
  });

  await test.step('Should validate first row with uploaded PAs', async () => {
    await table.clickOnPaNumber(1);
  });

  await test.step('Should validate PA profile opened succesfully, add a note and validate new note log tile', async () => {
    const userName = process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN!;
    await registration.validateHeaderToContainText(
      englishTranslations['registration-details'].pageTitle,
    );
    await registration.addNote(
      englishTranslations['registration-details']['activity-overview'].actions,
      englishTranslations['registration-details']['activity-overview'].action[
        'add-note'
      ],
    );
    await registration.writeNote({
      placeholder:
        englishTranslations['registration-details']['activity-overview'][
          'add-note-popup'
        ]['note-textarea-placeholder'],
      note: englishTranslations['registration-details']['activity-overview'][
        'add-note-popup'
      ]['note-visible'],
      buttonName: englishTranslations.common.ok,
    });
    await registration.validateNoteTile({
      changeTitle:
        englishTranslations.page.program['program-people-affected'].column.note,
      userName: userName,
      date: await helpers.getTodaysDate(),
      noteContent:
        englishTranslations['registration-details']['activity-overview'][
          'add-note-popup'
        ]['note-visible'],
    });
  });
});
