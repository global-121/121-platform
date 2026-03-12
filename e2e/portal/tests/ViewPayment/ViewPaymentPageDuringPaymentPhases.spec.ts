import { format } from 'date-fns';

import { env } from '@121-service/src/env';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { createOrReplaceProgramApprovalThresholds } from '@121-service/test/helpers/program-approval-threshold.helper';
import { getAllUsersByProgramId } from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const duplicateNumberOfRegistrations = 3;
const registrationsCount = Math.pow(2, duplicateNumberOfRegistrations);
const paymentId = 1;
const paymentAmount =
  registrationsCount *
  registrationOCW1.paymentAmountMultiplier *
  NLRCProgram.fixedTransferValue;

const approvedBadgeLabel = 'Approved';
const successfulBadgeLabel = 'Successful';
const pendingApprovalTransactionLabel = 'Pending approval';
const approverBadgeLabelAdmin = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;
const approverBadgeLabelSubAdmin = env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER;
const approverBadgeLabelApprover = env.USERCONFIG_121_SERVICE_EMAIL_APPROVER;
const approverBadgeLabelSubApprover =
  env.USERCONFIG_121_SERVICE_EMAIL_USER_KOBO_VALIDATION;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationOCW1],
    programId: programIdOCW,
    approverMode: ApproverSeedMode.demo,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
  // Seed duplicate registrations to have more transactions in the payment and better validate the badges on the payment page during the test
  await resetDuplicateRegistrations(duplicateNumberOfRegistrations);
  // Configure approval thresholds so both levels apply to payment amount (25)
  // Default seed creates level 2 at amount 100, but fixedTransferValue is 25
  const accessToken = await getAccessToken();

  const allUsersResponse = await getAllUsersByProgramId({
    accessToken,
    programId: programIdOCW,
  });

  const adminUser = allUsersResponse.body.find(
    (u) => u.username === env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
  );
  const subAdminApprover = allUsersResponse.body.find(
    (u) => u.username === approverBadgeLabelSubAdmin,
  );

  const approverRoleUser = allUsersResponse.body.find(
    (u) => u.username === approverBadgeLabelApprover,
  );
  const subApproverRoleUser = allUsersResponse.body.find(
    (u) => u.username === approverBadgeLabelSubApprover,
  );

  if (
    !adminUser ||
    !approverRoleUser ||
    !subApproverRoleUser ||
    !subAdminApprover
  ) {
    throw new Error('Required user assignments not found');
  }

  await createOrReplaceProgramApprovalThresholds({
    programId: programIdOCW,
    thresholds: [
      {
        thresholdAmount: 0,
        userIds: [adminUser.id, subAdminApprover.id],
      },
      {
        thresholdAmount: 10,
        userIds: [approverRoleUser.id, subApproverRoleUser.id],
      },
    ],
    accessToken,
  });
});

test('Payment page should display correctly during all phases of payment with 2 approvers', async ({
  page,
  loginPage,
  paymentPage,
  paymentsPage,
}) => {
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
      approverName: approverBadgeLabelSubAdmin!,
      rank: 1,
      approved: false,
    });
    await paymentPage.validateApprovalFlowStep({
      approverName: approverBadgeLabelApprover!,
      rank: 2,
      approved: false,
    });
    await paymentPage.validateApprovalFlowStep({
      approverName: approverBadgeLabelSubApprover!,
      rank: 2,
      approved: false,
    });

    await paymentPage.validateButtonVisibility({
      isVisible: true,
      button: 'approve',
    });
  });

  await test.step('Validate payment card in "Pending approval" state', async () => {
    const lastPaymentDate = format(new Date(), 'dd/MM/yyyy');
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount,
      registrationsNumber: registrationsCount,
      successfulPaymentAmount: 0,
      failedTransactions: 0,
      programId: programIdOCW,
      paymentId,
    });
    await page.goto(`/en-GB/program/${programIdOCW}/payments/${paymentId}`);
    await paymentPage.waitForPageLoad();
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
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_APPROVER ?? '',
      env.USERCONFIG_121_SERVICE_PASSWORD_APPROVER ?? '',
    );
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

  await test.step('Validate payment card in "Approved" state', async () => {
    const lastPaymentDate = format(new Date(), 'dd/MM/yyyy');
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount,
      registrationsNumber: registrationsCount,
      successfulPaymentAmount: 0,
      failedTransactions: 0,
      programId: programIdOCW,
      paymentId,
    });
    await page.goto(`/en-GB/program/${programIdOCW}/payments/${paymentId}`);
    await paymentPage.waitForPageLoad();
  });

  await test.step('Start payment', async () => {
    // return to admin-user
    await paymentPage.selectAccountOption('Logout');
    await loginPage.login();
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
