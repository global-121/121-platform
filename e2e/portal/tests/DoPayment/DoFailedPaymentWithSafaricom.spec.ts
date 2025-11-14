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
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.safaricomProgram, __filename);
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
  await loginPage.login();
});

test('Do failed payment for Safaricom fsp', async ({ page }) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const programTitle = KRCSProgram.titlePortal.en;
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
    await paymentsPage.selectProgram(programTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    // Create payment
    await paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(
        `/en-GB/program/${programIdSafaricom}/payments/1`,
      ),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.validateToastMessageAndClose('Payment created.');

    // start payment
    await paymentPage.startPayment();
    await paymentPage.validateToastMessageAndClose(
      'Payment started successfully.',
    );
  });

  await test.step('Validate payment card with failed payment data', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.navigateToProgramPage('Payments');
    // First try to validate the payment card where system still waits for the response from the PA with Voucher payment method.
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulTransfers: 0,
      failedTransfers: numberOfPas,
      currency: KRCSProgram.currency,
      programId: programIdSafaricom,
    });
  });
});
