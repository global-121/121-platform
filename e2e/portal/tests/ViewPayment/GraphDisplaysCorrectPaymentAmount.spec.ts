import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, programIdOCW, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Table should reflect the actual transfer values sent to the PAs in this payment', async ({
  page,
}) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NLRCProgram.titlePortal.en;
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.startPayment();
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdOCW}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate transfer value after "payment in progress" chip disappears in Payment overview', async () => {
    await paymentPage.validateToastMessage('Payment created.');
    await paymentPage.waitForPaymentToComplete();

    await paymentPage.validateTransferValues({
      amount: defaultMaxTransferValue,
    });
  });
});
