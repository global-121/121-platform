import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import NLRCProgram from '@121-service/seed-data/program/program-nlrc-ocw.json';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../../interfaces/Portal/src/assets/i18n/en.json';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, OcwProgramId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28445] OCW: Make Successful payment', async ({ page }) => {
  const tableModule = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const registrationPage = new RegistrationDetails(page);
  const paymentsPage = new PaymentsPage(page);

  const numberOfPas = registrationsOCW.length;
  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const maxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
    await navigationModule.navigateToProgramTab(
      englishTranslations.page.program.tab.payment.label,
    );
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
    await tableModule.clickOnPaNumber(1);

    await registrationPage.validateQuantityOfActivity({ quantity: 5 });

    await registrationPage.openActivityOverviewTab(
      englishTranslations['registration-details']['activity-overview'].filters
        .payment,
    );
    await registrationPage.validatePaymentsTab({
      paymentLabel: englishTranslations.page.program.tab.payment.label,
      paymentNumber: 1,
      statusLabel: englishTranslations.entity.payment.status.success,
    });

    await registrationPage.openActivityOverviewTab(
      englishTranslations['registration-details']['activity-overview'].filters
        .message,
    );
    await registrationPage.validateSentMessagesTab({
      messageNotification:
        englishTranslations.entity.message['content-type']['generic-templated'],
      messageContext:
        englishTranslations.entity.message['content-type'].payment,
      messageType: englishTranslations.entity.message.type.whatsapp,
    });
  });
});
