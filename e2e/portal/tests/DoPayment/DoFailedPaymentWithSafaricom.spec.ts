import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import KRCSProgram from '@121-service/src/seed-data/program/program-safaricom.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.safaricomProgram);
  const accessToken = await getAccessToken();
  // Phone number is set to 254000000000 to create a failed payment
  registrationsSafaricom[0].phoneNumber = '254000000000';
  await seedIncludedRegistrations(
    registrationsSafaricom,
    programIdSafaricom,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[36096] Do failed payment for Safaricom fsp', async ({ page }) => {
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = KRCSProgram.titlePortal.en;
  const numberOfPas = registrationsSafaricom.length;
  const defaultTransferValue = KRCSProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsSafaricom.reduce(
    (output, pa) => {
      return output + pa.paymentAmountMultiplier * defaultTransferValue;
    },
    0,
  );
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.startPayment();
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(
        `/en-GB/project/${programIdSafaricom}/payments/1`,
      ),
    );
    // Assert payment overview page by payment date/ title
    await paymentsPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate payment card for failed payments', async () => {
    await paymentsPage.validateToastMessageAndWait('Payment created.');
    await paymentsPage.navigateToProgramPage('Payments');
    await paymentsPage.waitForPaymentToComplete();
    // First try to validate the payment card where system still waits for the response from the PA with Voucher payment method.
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulTransfers: 0,
      failedTransfers: numberOfPas,
      currency: KRCSProgram.currency,
    });
    // DO NOT MAKE IT A RULE!!!
    // Only in this case we need to reload the page to get the updated data of the successful payments.
    // This is a workaround for the case when the PA is subscribed to the program that uses telecom provider. And the data is updated asynchronously with other payment methods.
    await page.reload();
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulTransfers: 0,
      failedTransfers: numberOfPas,
      currency: KRCSProgram.currency,
    });
  });
});
