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
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

const note = 'test payment note';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [registrationOCW1],
    programIdOCW,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[37781] View payment log, including note added to payment', async ({
  page,
}) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NLRCProgram.titlePortal.en;
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment with note', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.startPayment(note);
    const paymentId = 1; // First payment in this context, so ID 1
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(
        `/en-GB/project/${programIdOCW}/payments/${paymentId}`,
      ),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate payment log, including note', async () => {
    await paymentPage.validatePaymentLog(note);
  });
});
