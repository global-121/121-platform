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
const paymentFilter =
  englishTranslations['registration-details']['activity-overview'].filters
    .payment;
const paymentFilterByMessage =
  englishTranslations.entity.message['content-type']['generic-templated'];
const messageContext =
  englishTranslations.entity.message['content-type'].payment;
const messageType = englishTranslations.entity.message.type.whatsapp;
const paymentFilterByTab =
  englishTranslations['registration-details']['activity-overview'].filters
    .message;
const defaultTransferValue = NLRCProgram.fixedTransferValue;

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

test('[28447] OCW: Send payment instructions with changed transfer value', async ({
  page,
}) => {
  const table = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const registrationPage = new RegistrationDetails(page);
  const paymentsPage = new PaymentsPage(page);

  const numberOfPas = registrationsOCW.length;
  const newTransferValue = 15;

  const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  const newMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * newTransferValue;
  }, 0);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await navigationModule.navigateToProgramTab(paymentLabel);
  });

  await test.step('Do payment #1', async () => {
    await table.doPayment(1);
    await paymentsPage.executePayment({
      numberOfPas,
      defaultTransferValue,
      defaultMaxTransferValue,
      newTransferValue,
      newMaxTransferValue,
    });
  });

  await test.step('Check PA payments and messages', async () => {
    await table.openFspProfile({ shouldIncludeVisa: true });
    await registrationPage.validateQuantityOfActivity({ quantity: 5 });
    await registrationPage.openActivityOverviewTab(paymentFilter);
    await registrationPage.validatePaymentsTab({
      paymentLabel: paymentLabel,
      paymentNumber: 1,
      statusLabel: paymentStatus,
    });

    await registrationPage.openActivityOverviewTab(paymentFilterByTab);
    await paymentsPage.validateSentMessagesTab({
      messageNotification: paymentFilterByMessage,
      messageContext: messageContext,
      messageType: messageType,
    });
  });
});
