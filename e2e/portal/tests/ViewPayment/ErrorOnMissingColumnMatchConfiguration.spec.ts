import { test } from '@playwright/test';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { deleteProgramFspConfigurationProperty } from '@121-service/test/helpers/program-fsp-configuration.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

// Export Excel FSP payment list
const amount = NLRCProgramPV.fixedTransferValue;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await deleteProgramFspConfigurationProperty({
    programId: programIdPV,
    accessToken,
    configName: Fsps.excel,
    propertyName: FspConfigurationProperties.columnToMatch,
  });
  await seedIncludedRegistrations(
    registrationsPvExcel,
    programIdPV,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[32302] [Excel fsp]: Error message should be shown in case no matching column was configured', async ({
  page,
}) => {
  const paymentsPage = new PaymentsPage(page);
  const paymentPage = new PaymentPage(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;
  const numberOfPas = registrationsPvExcel.length;
  const defaultTransferValue = amount;
  const defaultMaxTransferValue = registrationsPvExcel.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const fsps: string[] = ['Excel Payment Instructions'];

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Create payment', async () => {
    // Create payment
    await paymentsPage.createPayment();
    await paymentsPage.validateExcelFspInstructions();
    await paymentsPage.validatePaymentSummary({
      fsp: fsps,
      registrationsNumber: numberOfPas,
      currency: '€',
      paymentAmount: defaultMaxTransferValue,
    });
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdPV}/payments/1`),
    );

    // start payment
    await paymentPage.startPayment();
    await paymentPage.validateToastMessageAndClose(
      'Something went wrong: "Missing required configuration columnToMatch for FSP Excel"',
    );
  });
});
