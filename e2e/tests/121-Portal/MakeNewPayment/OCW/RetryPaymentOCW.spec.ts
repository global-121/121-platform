import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { doPaymentForAllPAs } from '@121-service/test/helpers/program.helper';
import {
  bulkUpdateRegistrationsCSV,
  importRegistrationsCSV,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { AppRoutes } from '../../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../../interfaces/Portal/src/assets/i18n/en.json';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const paymentLabel = englishTranslations.page.program.tab.payment.label;
const ok = englishTranslations.common.ok;
const programActions =
  englishTranslations.page.program['program-people-affected'].actions.include;
const peopleAffectedLabel =
  englishTranslations.page.program.tab['people-affected'].label;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();

  await importRegistrationsCSV(
    programIdOCW,
    './test-registration-data/test-registrations-OCW.csv',
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28450] OCW: Retry payment for all failed payments of PAs', async ({
  page,
}) => {
  const tableModule = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const paymentsPage = new PaymentsPage(page);

  const numberOfPas = 20;
  const defaultTransferValue = NLRCProgram.fixedTransferValue;

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await navigationModule.navigateToProgramTab(peopleAffectedLabel);
  });

  await test.step('Include registrations', async () => {
    await tableModule.applyBulkAction({
      label: programActions,
    });
    await tableModule.acceptBulkAction();
  });

  await test.step('Make first failed payment', async () => {
    const accessToken = await getAccessToken();

    await navigationModule.navigateToProgramTab(paymentLabel);
    await doPaymentForAllPAs({
      programId: programIdOCW,
      paymentNr: 1,
      amount: defaultTransferValue,
      accessToken: accessToken,
    });
    await page.reload();
    await paymentsPage.validatePaymentStatus({});
    await paymentsPage.validateFailedPaymentStatus({ payments: 4 });
  });

  await test.step('Retry payment with correct PA values', async () => {
    const accessToken = await getAccessToken();

    await bulkUpdateRegistrationsCSV(
      programIdOCW,
      './test-registration-data/test-registrations-patch-OCW.csv',
      accessToken,
      'Bulk update for test registrations due to data validation improvements',
    );
    await paymentsPage.retryPayment({
      buttonName: ok,
    });
    await paymentsPage.validateSuccessfulPaymentStatus({
      payments: numberOfPas,
    });
  });
});
