import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
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
import { AppRoutes } from '../../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../../interfaces/Portal/src/assets/i18n/en.json';

const nlrcPVProgrammeTitle = NLRCProgramPV.titlePortal.en;
const paymentLabel = englishTranslations.page.program.tab.payment.label;
const paymentStatus = englishTranslations.entity.payment.status.success;
const defaultTransferValue = NLRCProgramPV.fixedTransferValue;
const paymentFilter =
  englishTranslations['registration-details']['activity-overview'].filters
    .payment;
const paymentFilterByNotification =
  englishTranslations.entity.message['content-type']['payment-templated'];
const messageContext =
  englishTranslations.entity.message['content-type']['payment-voucher'];
const messageType = englishTranslations.entity.message.type.whatsapp;
const paymentFilterByTab =
  englishTranslations['registration-details']['activity-overview'].filters
    .message;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;
  const pvProgramId = programIdPV;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, pvProgramId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28463] PV: Make Successful payment', async ({ page }) => {
  const tableModule = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const registrationPage = new RegistrationDetails(page);
  const paymentsPage = new PaymentsPage(page);
  const numberOfPas = registrationsPV.length;
  const maxTransferValue = registrationsPV.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcPVProgrammeTitle);
    await navigationModule.navigateToProgramTab(paymentLabel);
  });

  await test.step('Do payment #1', async () => {
    await tableModule.doPayment(1);
    await paymentsPage.executePayment({
      numberOfPas,
      defaultTransferValue,
      maxTransferValue,
    });
  });

  await test.step('Check PA payments and messages', async () => {
    await tableModule.clickOnPaNumber(2);

    await registrationPage.validateQuantityOfActivity({ quantity: 8 });

    await registrationPage.openActivityOverviewTab(paymentFilter);
    await registrationPage.validatePaymentsTab({
      paymentLabel: paymentLabel,
      paymentNumber: 1,
      statusLabel: paymentStatus,
    });

    await registrationPage.openActivityOverviewTab(paymentFilterByTab);
    await registrationPage.validateSentMessagesTab({
      messageNotification: paymentFilterByNotification,
      messageContext: messageContext,
      messageType: messageType,
    });
  });
});
