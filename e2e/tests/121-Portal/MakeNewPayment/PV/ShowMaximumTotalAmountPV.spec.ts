import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../../interfaces/Portal/src/assets/i18n/en.json';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;
  const pvProgramId = programIdPV;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, pvProgramId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28464] PV: Show maximum total amount (Dry Run)', async ({ page }) => {
  const tableModule = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const paymentsPage = new PaymentsPage(page);

  const numberOfPas = registrationsPV.length;
  const defaultTransferValue = NLRCProgramPV.fixedTransferValue;
  const maxTransferValue = registrationsPV.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(NLRCProgramPV.titlePortal.en);
    await navigationModule.navigateToProgramTab(
      englishTranslations.page.program.tab.payment.label,
    );
  });

  await test.step('Do payment #1', async () => {
    await tableModule.doPayment(1);
    await paymentsPage.verifyPaymentPopupValues({
      numberOfPas,
      defaultTransferValue,
      maxTransferValue,
    });
  });
});