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

const programIdOCW = 3;
const OcwProgramId = programIdOCW;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28005] Bug: Only English was enabled in templated messages', async ({
  page,
}) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page and change the language to Spanish', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
    await table.selectTable('Payment');
    await table.clickOnPaNumber(1);
    await registration.openEditPaPopUp();
    await registration.validateEditPaPopUpOpened();
    await registration.changePreferredLanguage({
      language:
        englishTranslations.page.program['program-people-affected'].language.nl,
      saveButtonName: englishTranslations.common.save,
      okButtonName: englishTranslations.common.ok,
    });
  });

  await test.step('Send messages to two different PAs with different preferred languages', async () => {
    await page.goto(`/program/${programIdOCW}/payment`);

    // to be continued
  });
});
