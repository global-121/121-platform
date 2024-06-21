import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PersonalInformationPopUp from '@121-e2e/pages/PersonalInformationPopUp/PersonalInformationPopUp';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import visaFspIntersolve from '@121-service/src/seed-data/fsp/fsp-intersolve-visa.json';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';
import HomePage from '../../../pages/Home/HomePage';
import LoginPage from '../../../pages/Login/LoginPage';
import RegistrationDetails from '../../../pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '../../../pages/Table/TableModule';

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

test('[27659][27611] Open the edit PA popup', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);
  const navigationModule = new NavigationModule(page);
  const piiPopUp = new PersonalInformationPopUp(page);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
    await navigationModule.navigateToProgramTab(
      englishTranslations.page.program.tab.payment.label,
    );
  });

  await test.step('Should open first uploaded PA', async () => {
    await table.clickOnPaNumber(2);
  });

  await test.step('Should open PA profile and open edit pop-up', async () => {
    await registration.validateHeaderToContainText(
      englishTranslations['registration-details'].pageTitle,
    );
    await registration.openEditPaPopUp();
    await registration.validateEditPaPopUpOpened();
    await piiPopUp.validateFspNamePresentInEditPopUp(
      visaFspIntersolve.displayName.en,
    );
  });
});
