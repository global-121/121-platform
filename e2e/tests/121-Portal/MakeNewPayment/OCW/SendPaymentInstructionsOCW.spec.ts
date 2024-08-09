import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { AppRoutes } from '../../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../../interfaces/Portal/src/assets/i18n/en.json';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const paymentLabel = englishTranslations.page.program.tab.payment.label;
const paymentStatus = englishTranslations.entity.payment.status.success;
const paymentFilterByMessage =
  englishTranslations.entity.message['content-type']['generic-templated'];
const messageContext =
  englishTranslations.entity.message['content-type'].payment;
const messageType = englishTranslations.entity.message.type.whatsapp;

const cancel = englishTranslations.common.cancel;
const status = 'success';
const amount = 25;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, OcwProgramId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test.skip('[28448] OCW: Send payment instructions', async ({ page }) => {
  const table = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const registrationPage = new RegistrationDetails(page);
  const paymentsPage = new PaymentsPage(page);
  const paymentNumber = 1;
  const numberOfPas = registrationsOCW.length;
  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await navigationModule.navigateToProgramTab(paymentLabel);
  });

  await test.step('Do payment #1', async () => {
    await table.doPayment(paymentNumber);
    await paymentsPage.executePayment({
      numberOfPas,
      defaultTransferValue,
      defaultMaxTransferValue,
    });
  });

  await test.step('Check payment status under export payment data', async () => {
    await paymentsPage.verifyPaymentOptionUnderPaymentData({
      paymentNumber: paymentNumber,
    });
  });

  await test.step('Check payment status under bulk action', async () => {
    await paymentsPage.verifyPaymentOptionUnderAction({
      paymentNumber: paymentNumber,
    });
  });

  await test.step('Check payment history', async () => {
    await paymentsPage.openPaymentHistory({});
    await registrationPage.validatePaymentsTab({
      paymentLabel: paymentLabel,
      paymentNumber: 1,
      statusLabel: paymentStatus,
    });
  });

  await test.step('Check message', async () => {
    await page.reload();
    await paymentsPage.openMessage({});
    await paymentsPage.validateSentMessagesTab({
      messageNotification: paymentFilterByMessage,
      messageContext: messageContext,
      messageType: messageType,
    });
    await paymentsPage.closePopup(cancel);
  });

  await test.step('Check payment column in the exported report', async () => {
    const option = `Payment #${paymentNumber}`;
    await paymentsPage.selectPaymentOption(option);
    await table.exportPayMentData({
      status: status,
      amount: amount,
    });
  });
});
