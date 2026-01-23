import { Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import programOcw from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
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

const login = async ({
  page,
  email,
  password,
}: {
  page: Page;
  email?: string;
  password?: string;
}) => {
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(email, password);
};

const duplicateNumberOfRegistrations = 3;
const registrationsCount = Math.pow(2, duplicateNumberOfRegistrations);
const paymentId = 1;

const approvedBadgeLabel = 'Approved';
const successfulBadgeLabel = 'Successful';
const pendingApprovalTransactionLabel = 'Pending approval';
const approverBadgeLabelAdmin = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;
const approverBadgeLabelApprover = env.USERCONFIG_121_SERVICE_EMAIL_APPROVER;

test.beforeEach(async ({ page }) => {
  await resetDB(
    SeedScript.nlrcMultiple,
    __filename,
    undefined,
    ApproverSeedMode.demo, // seeds 2 approvers: admin and approver-role user
  );
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

test('Payment page should display correctly during all phases of payment with 2 approvers', async ({
  page,
}) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const programTitle = programOcw.titlePortal.en;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(programTitle);
    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(
        `/en-GB/program/${programIdOCW}/payments/${paymentId}`,
      ),
    );
    await paymentPage.dismissToast();
  });

  await test.step('Validate payment-page in "Pending approval" state', async () => {
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: '0 of 2 approved',
      isVisible: true,
      count: 1,
    });
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: pendingApprovalTransactionLabel,
      isVisible: true,
      count: 8, // 1 per transaction
    });

    await paymentPage.validateApprovalFlowStep({
      approverName: approverBadgeLabelAdmin,
      rank: 1,
      approved: false,
    });
    await paymentPage.validateApprovalFlowStep({
      approverName: approverBadgeLabelApprover!,
      rank: 2,
      approved: false,
    });

    await paymentPage.validateButtonVisibility({
      isVisible: true,
      button: 'approve',
    });
  });

  await test.step('1st Approve payment by admin', async () => {
    await paymentPage.approvePayment();
    await paymentPage.validateToastMessage('Payment approved successfully.');
  });

  await test.step('Validate payment-page in between 2 approvals', async () => {
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: '1 of 2 approved',
      isVisible: true,
      count: 1,
    });
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: pendingApprovalTransactionLabel,
      isVisible: true,
      count: 8, // 1 per transaction
    });

    await paymentPage.validateApprovalFlowStep({
      approverName: approverBadgeLabelAdmin,
      approved: true,
    });
    await paymentPage.validateApprovalFlowStep({
      approverName: approverBadgeLabelApprover!,
      rank: 2,
      approved: false,
    });

    await paymentPage.validateButtonVisibility({
      isVisible: false,
      button: 'approve',
    });
  });

  await test.step('2nd Approve payment by approver-role user', async () => {
    // log in as approver-user
    await paymentPage.selectAccountOption('Logout');
    await login({
      page,
      email: env.USERCONFIG_121_SERVICE_EMAIL_APPROVER!,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_APPROVER!,
    });
    await page.goto(`/en-GB/program/${programIdOCW}/payments/${paymentId}`);
    await paymentPage.waitForPageLoad();

    await paymentPage.approvePayment();
    await paymentPage.validateToastMessage('Payment approved successfully.');
  });

  await test.step('Validate payment-page in "Approved" state', async () => {
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: approvedBadgeLabel,
      isVisible: true,
      count: 9, // 1 top of the chart + 8 transactions
    });
    await paymentPage.validateGraphStatus({
      approved: registrationsCount,
      processing: 0,
      successful: 0,
      failed: 0,
    });

    await paymentPage.validateButtonVisibility({
      isVisible: false,
      button: 'start',
    });
  });

  await test.step('Start payment', async () => {
    // return to admin-user
    await paymentPage.selectAccountOption('Logout');
    await login({
      page,
    });
    await page.goto(`/en-GB/program/${programIdOCW}/payments/${paymentId}`);
    await paymentPage.waitForPageLoad();

    await paymentPage.startPayment();
    await paymentPage.validateToastMessage('Payment started successfully.');
    await paymentPage.waitForPaymentToComplete();
  });

  await test.step('Validate payment-page after "Start" (and complete)', async () => {
    // Reload the page because Successful badges are not displayed without reload
    await page.goto(`/en-GB/program/${programIdOCW}/payments/${paymentId}`);
    await paymentPage.waitForPageLoad();

    await paymentPage.validateGraphStatus({
      approved: 0,
      processing: 0,
      successful: registrationsCount,
      failed: 0,
    });
    // Validate 1 approved badge for payment and 8 successful badges for transactions
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

    await paymentPage.validateButtonVisibility({
      isVisible: false,
      button: 'start',
    });
  });
});
