import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import PersonalInformationPopUp from '@121-e2e/pages/PersonalInformationPopUp/PersonalInformationPopUp';
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
const save = englishTranslations.common.save;
const ok = englishTranslations.common.ok;

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

test('[28040] Update paymentAmountMultiplier with invalid value', async ({
  page,
}) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);
  const piiPopUp = new PersonalInformationPopUp(page);
  const alertPattern = englishTranslations.common['error-with-message'];

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
  });

  await test.step('Open information pop-up', async () => {
    await table.openPaPersonalInformation({});
  });

  await test.step('Update payment amount multiplier with empty string', async () => {
    await piiPopUp.updatepaymentAmountMultiplier({
      amount: '',
      saveButtonName: save,
      okButtonName: ok,
      alert: alertPattern.replace(
        '{{error}}',
        'paymentAmountMultiplier must be a positive number',
      ),
    });
  });

  await test.step('Update payment amount multiplier with negative number', async () => {
    await piiPopUp.updatepaymentAmountMultiplier({
      amount: '-1',
      saveButtonName: save,
      okButtonName: ok,
      alert: alertPattern.replace(
        '{{error}}',
        'paymentAmountMultiplier must be a positive number',
      ),
    });
  });

  await test.step('Update payment amount multiplier with a string', async () => {
    await piiPopUp.updatepaymentAmountMultiplier({
      amount: 'Multiplier',
      saveButtonName: save,
      okButtonName: ok,
      alert: alertPattern.replace('{{error}}', 'Input should be an integer'),
    });
  });
});
