import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import KRCSProgram from '@121-service/src/seed-data/program/program-krcs-turkana.json';
import {
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';

import { AppRoutes } from '../../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../../interfaces/Portal/src/assets/i18n/en.json';

const krcsProgramTitle = KRCSProgram.titlePortal.en;
const ok = englishTranslations.common.ok;
const paymentLabel = englishTranslations.page.program.tab.payment.label;
const paymentStatus = englishTranslations.entity.payment.status.error;
const paymentFilter =
  englishTranslations['registration-details']['activity-overview'].filters
    .payment;
const paymentErrorMessages =
  englishTranslations.page.program['program-people-affected'][
    'payment-status-popup'
  ]['fix-error'];
const programIdBHA = 2;
const bhaProgramId = programIdBHA;
const registrationsSafaricomRetry = JSON.parse(
  JSON.stringify(registrationsSafaricom),
);

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.krcsMultiple);

  registrationsSafaricomRetry[0].phoneNumber = '254000000000';

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    registrationsSafaricomRetry,
    bhaProgramId,
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

test('[30279] Safaricom: Retry failed payment', async ({ page }) => {
  const table = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const registrationPage = new RegistrationDetails(page);
  const paymentsPage = new PaymentsPage(page);

  const numberOfPas = registrationsSafaricomRetry.length;
  const defaultTransferValue = KRCSProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsSafaricom.reduce(
    (output, pa) => {
      return output + pa.paymentAmountMultiplier * defaultTransferValue;
    },
    0,
  );
  const currency = KRCSProgram.currency;

  // Format the number
  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
  }).format(defaultMaxTransferValue);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(krcsProgramTitle);
    await navigationModule.navigateToProgramTab(paymentLabel);
  });

  await test.step('Do payment #1', async () => {
    await table.doPayment(1);
    await paymentsPage.executeNonEurPayment({
      numberOfPas,
      defaultTransferValue,
      defaultMaxTransferValue: formattedValue,
      currency,
    });
  });

  await test.step('Check PA payments and messages for failed payment and errors', async () => {
    // The assertion relies on the transfer status callback being in quicker then the steps below take to get the transaction status
    await table.openFspProfile({ shouldIncludeVisa: false });

    await registrationPage.validateQuantityOfActivity({ quantity: 3 });

    await registrationPage.openActivityOverviewTab(paymentFilter);
    await registrationPage.validatePaymentsTab({
      paymentLabel,
      paymentNumber: 1,
      statusLabel: paymentStatus,
    });
    await registrationPage.validatePaymentErrorMessages({
      messageContent: paymentErrorMessages,
    });

    await test.step('Retry payment', async () => {
      await page.goto('/');
      await homePage.navigateToProgramme(krcsProgramTitle);
      await navigationModule.navigateToProgramTab(paymentLabel);
      await paymentsPage.validatePaymentStatus({});
      await paymentsPage.validateFailedPaymentStatus({ payments: 1 });
      const accessToken = await getAccessToken();

      await updateRegistration(
        bhaProgramId,
        registrationsSafaricomRetry[0].referenceId,
        {
          phoneNumber: '254708374149',
        },
        'automated test',
        accessToken,
      );

      await paymentsPage.retryPayment({
        buttonName: ok,
      });
      await paymentsPage.validateSuccessfulPaymentStatus({
        payments: numberOfPas,
      });
    });
  });
});
