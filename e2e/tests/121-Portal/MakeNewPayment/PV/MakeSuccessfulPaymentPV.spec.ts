import { test } from '@playwright/test';

import { AppRoutes } from '@121-portal/src/app/app-routes.enum';
import FspName from '@121-portal/src/app/enums/fsp-name.enum';
import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import {
  waitForMessagesToComplete,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';

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

let accessToken: string;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;
  const pvProgramId = programIdPV;

  accessToken = await getAccessToken();
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
  const table = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const homePage = new HomePage(page);
  const registrationPage = new RegistrationDetails(page);
  const paymentsPage = new PaymentsPage(page);
  const numberOfPas = registrationsPV.length;
  const defaultMaxTransferValue = registrationsPV.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcPVProgrammeTitle);
    await navigationModule.navigateToProgramTab(paymentLabel);
  });

  await test.step('Do payment #1', async () => {
    await table.doPayment(1);
    await paymentsPage.executePayment({
      numberOfPas,
      defaultTransferValue,
      defaultMaxTransferValue,
    });
  });

  await test.step('Check PA payments and messages', async () => {
    await waitForPaymentTransactionsToComplete(
      programIdPV,
      registrationsPV.map((pa) => pa.referenceId),
      accessToken,
      5000,
    );
    const registrationsWithVoucher = registrationsPV.filter(
      (r) =>
        r.programFinancialServiceProviderConfigurationName ===
        FspName.intersolveVoucherWhatsapp,
    );
    await waitForMessagesToComplete({
      programId: programIdPV,
      referenceIds: registrationsWithVoucher.map((pa) => pa.referenceId),
      accessToken,
      minimumNumberOfMessagesPerReferenceId: 3,
    });
    await table.openFspProfile({ shouldIncludeVisa: false });

    await registrationPage.validateQuantityOfActivity({ quantity: 8 });

    await registrationPage.openActivityOverviewTab(paymentFilter);
    await registrationPage.validatePaymentsTab({
      paymentLabel,
      paymentNumber: 1,
      statusLabel: paymentStatus,
    });

    await registrationPage.openActivityOverviewTab(paymentFilterByTab);
    await paymentsPage.validateSentMessagesTab({
      messageNotification: paymentFilterByNotification,
      messageContext,
      messageType,
    });
  });
});
