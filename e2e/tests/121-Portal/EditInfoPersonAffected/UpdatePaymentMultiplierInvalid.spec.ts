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

test('[28057] Update paymentAmountMultiplier with invalid value', async ({
  page,
}) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);
  const registration = new RegistrationDetails(page);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
  });

  await test.step('Open information pop-up', async () => {
    await table.openPaPersonalInformation({});
  });

  await test.step('Update payment amount multiplier', async () => {
    await registration.updatepaymentAmountMultiplier({
      amount: '2',
      saveButtonName: englishTranslations.common.save,
      okButtonName: englishTranslations.common.ok,
    });
  });

  await test.step('Validate payment multiplier updated', async () => {
    await page.reload();
    await table.openPaPersonalInformation({});
    await registration.validateAmountMultiplier({ amount: '2' });
  });
});
