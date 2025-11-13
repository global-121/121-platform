import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [registrationOCW1],
    programIdOCW,
    accessToken,
  );
  await resetDuplicateRegistrations(3);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Badges should display correct statuses', async ({ page }) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NLRCProgram.titlePortal.en;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdOCW}/payments/1`),
    );
  });

  await test.step('Validate "Pending approval" badges and details', async () => {
    await paymentPage.validateGraphStatus({
      pending: 0,
      successful: 0,
      failed: 0,
      pendingApproval: 8,
    });
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: 'Pending approval',
      isVisible: true,
      count: 9,
    });
  });

  await test.step('Validate Start Payment button is visible', async () => {
    await paymentPage.validateStartPaymentButtonVisibility({ isVisible: true });
  });

  await test.step('Approve and start payment', async () => {
    await paymentPage.startPayment();
  });

  await test.step('Validate all registrations have "Approved" badges', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: 'Approved',
      isVisible: true,
      count: 9,
    });
  });

  await test.step('Validate Start Payment button is hidden', async () => {
    await paymentPage.validateStartPaymentButtonVisibility({
      isVisible: false,
    });
  });
});
