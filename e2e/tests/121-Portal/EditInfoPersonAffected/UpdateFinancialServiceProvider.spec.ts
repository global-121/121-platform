import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import PersonalInformationPopUp from '@121-e2e/pages/PersonalInformationPopUp/PersonalInformationPopUp';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import fspIntersolveJumbo from '@121-service/src/seed-data/fsp/fsp-intersolve-jumbo-physical.json';
import visaFspIntersolve from '@121-service/src/seed-data/fsp/fsp-intersolve-visa.json';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { AppRoutes } from '../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';

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

test('[28048] Update chosen Finacial service provider', async ({ page }) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);
  const piiPopUp = new PersonalInformationPopUp(page);

  let rowNumber: number;

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
  });

  await test.step('Open information pop-up', async () => {
    rowNumber = await table.selectNonVisaFspPA();
  });

  await test.step('Update Finacial service provider from Jumbo card to Visa debit card', async () => {
    await piiPopUp.updatefinancialServiceProvider({
      fspNewName: visaFspIntersolve.displayName.en,
      fspOldName: fspIntersolveJumbo.displayName.en,
      saveButtonName: englishTranslations.common.save,
      okButtonName: englishTranslations.common.ok,
    });
  });

  await test.step('Validate Finacial service provider be updated', async () => {
    await table.validateFspCell({
      rowNumber: rowNumber,
      fspName: visaFspIntersolve.displayName.en,
    });
  });
});
