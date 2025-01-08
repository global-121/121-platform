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
import PersonalInformationPopUp from '@121-e2e/pages/PersonalInformationPopUp/PersonalInformationPopUp';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const save = englishTranslations.common.save;
const ok = englishTranslations.common.ok;
const dataChangesLabel =
  englishTranslations['registration-details']['activity-overview'].activities[
    'data-changes'
  ].label;

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

test('[28043] Update registration attributes successfully', async ({
  page,
}) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);
  const registration = new RegistrationDetails(page);
  const piiPopUp = new PersonalInformationPopUp(page);
  let oldAmount = '';

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
  });

  await test.step('Open information pop-up', async () => {
    await table.selectFspPaPii({ shouldSelectVisa: true });
  });

  await test.step('Update payment amount multiplier', async () => {
    oldAmount = await piiPopUp.updatepaymentAmountMultiplier({
      saveButtonName: save,
      okButtonName: ok,
    });
  });

  await test.step('navigate to PA profile page in data changes table', async () => {
    await page.reload();
    await table.openFspProfile({ shouldIncludeVisa: true });
  });

  await test.step('Validate the "Payments" tab on the PA Activity Overview table to Contain Payment notifications, correct status, userName and date', async () => {
    await registration.openActivityOverviewTab('Data changes');
    await registration.validateDataChangesTab({
      dataChangesLabel,
      oldValue: oldAmount,
      newValue: String(Number(oldAmount) + 1),
    });
  });
});
