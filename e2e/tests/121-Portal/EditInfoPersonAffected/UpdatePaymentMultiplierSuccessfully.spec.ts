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
import TableModule from '@121-e2e/pages/Table/TableModule';

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

test('[28038] Update paymentAmountMultiplier successfully', async ({
  page,
}) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);
  const piiPopUp = new PersonalInformationPopUp(page);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
  });

  await test.step('Open information pop-up', async () => {
    await table.selectFspPaPii({ shouldSelectVisa: true });
  });

  await test.step('Update payment amount multiplier', async () => {
    await piiPopUp.updatepaymentAmountMultiplier({
      amount: '2',
      saveButtonName: save,
      okButtonName: ok,
    });
  });

  await test.step('Validate payment multiplier updated', async () => {
    await page.reload();
    await table.selectFspPaPii({ shouldSelectVisa: true });
    await piiPopUp.validateAmountMultiplier({ amount: '2' });
  });
});
