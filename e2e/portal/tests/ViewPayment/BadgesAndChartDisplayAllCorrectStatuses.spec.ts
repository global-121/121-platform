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

const duplicateNumberOfRegistrations = 3;
const registrationsCount = Math.pow(2, duplicateNumberOfRegistrations);
const totalBadges = registrationsCount + 1; // +1 for top chart badge

const approvedBadgeLabel = 'Approved';
const successfulBadgeLabel = 'Successful';
const pendingApprovalBadgeLabel = 'Pending approval';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [registrationOCW1],
    programIdOCW,
    accessToken,
  );
  await resetDuplicateRegistrations(duplicateNumberOfRegistrations);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Badges and chart should display correct statuses during payment process', async ({
  page,
}) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NLRCProgram.titlePortal.en;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdOCW}/payments/1`),
    );
    await paymentPage.dismissToast();
  });

  await test.step('Validate "Pending approval" badges and details', async () => {
    await paymentPage.validateGraphStatus({
      pendingApproval: registrationsCount,
      approved: 0,
      processing: 0,
      successful: 0,
      failed: 0,
    });
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: pendingApprovalBadgeLabel,
      isVisible: true,
      // Those are all registrations badges plus top chart badges 8 + 1
      count: totalBadges,
    });
  });

  await test.step('Validate Start Payment button is visible', async () => {
    await paymentPage.validateStartPaymentButtonVisibility({ isVisible: true });
  });

  await test.step('Approve and start payment', async () => {
    await paymentPage.startPayment();
  });

  await test.step('Validate top of the chart has "Approved" badge', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.validateToastMessage('Payment started successfully.');
    await paymentPage.validateGraphStatus({
      pendingApproval: 0,
      approved: 0,
      processing: 0,
      successful: registrationsCount,
      failed: 0,
    });
    // Reload the page because Successful badges are not displayed without reload
    await page.goto(`/en-GB/project/${programIdOCW}/payments/1`);
    await paymentPage.waitForPageLoad();
    // Validate badges
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: approvedBadgeLabel,
      isVisible: true,
      count: 1,
    });
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: successfulBadgeLabel,
      isVisible: true,
      count: registrationsCount,
    });
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: pendingApprovalBadgeLabel,
      isVisible: false,
    });
  });

  await test.step('Validate Start Payment button is hidden', async () => {
    await paymentPage.validateStartPaymentButtonVisibility({
      isVisible: false,
    });
  });
});
