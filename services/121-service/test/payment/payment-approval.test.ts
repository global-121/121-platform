import { HttpStatus } from '@nestjs/common';

import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventAttributeKey } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  approvePayment,
  createPayment,
  getPaymentEvents,
  getPaymentSummary,
  getTransactionsByPaymentIdPaginated,
  startPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { replaceProgramApprovalThresholds } from '@121-service/test/helpers/program-approval-threshold.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import { getCurrentUser } from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  getAccessTokenCvaManager,
  getAccessTokenFinanceManager,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

let adminAccessToken: string;
const programId = programIdPV;
const transferValue = 25;

describe('do payment with 2 approvers', () => {
  let accessTokenFinanceManager: string;
  let paymentId: number;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    adminAccessToken = await getAccessToken();
    await seedIncludedRegistrations(
      [registrationPV5],
      programId,
      adminAccessToken,
    );

    // configure 2nd approver
    accessTokenFinanceManager = await getAccessTokenFinanceManager();
    const financeManagerUser = await getCurrentUser({
      accessToken: accessTokenFinanceManager,
    });

    // Get admin user ID
    const adminUser = await getCurrentUser({
      accessToken: adminAccessToken,
    });

    const updatedThresholds = [
      {
        thresholdAmount: 0, // Covers all amounts starting from 0

        userIds: [adminUser.body.user.id],
      },
      {
        thresholdAmount: 10, // Covers payments >= 10

        userIds: [financeManagerUser.body.user.id],
      },
    ];

    await replaceProgramApprovalThresholds({
      programId,
      thresholds: updatedThresholds,
      accessToken: adminAccessToken,
    });
  });

  beforeEach(async () => {
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken: adminAccessToken,
    });
    paymentId = createPaymentResponse.body.id;
  });

  it('should successfully do payment', async () => {
    // Act
    // Check approval status before any approvals
    const paymentSummaryBeforeApprovals = await getPaymentSummary({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(paymentSummaryBeforeApprovals.body).toMatchObject({
      isPaymentApproved: false,
      approvalsGiven: 0,
      approvalsRequired: 2,
    });

    // 1st approve
    const approvePaymentResponse = await approvePayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    const getTransactionsResultAfter1stApprove =
      await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        accessToken: adminAccessToken,
      });
    expect(getTransactionsResultAfter1stApprove.body.data[0].status).toBe(
      TransactionStatusEnum.pendingApproval,
    );

    // Check approval status after 1st approval
    const paymentSummaryAfter1stApproval = await getPaymentSummary({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(paymentSummaryAfter1stApproval.body).toMatchObject({
      isPaymentApproved: false,
      approvalsGiven: 1,
      approvalsRequired: 2,
    });

    // 2nd approve
    await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Check approval status after 2nd approval
    const paymentSummaryAfter2ndApproval = await getPaymentSummary({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(paymentSummaryAfter2ndApproval.body).toMatchObject({
      isPaymentApproved: true,
      approvalsGiven: 2,
      approvalsRequired: 2,
    });

    const startPaymentResponse = await startPayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentId,
      paymentReferenceIds: [registrationPV5.referenceId],
      accessToken: adminAccessToken,
      maxWaitTimeMs: 5000,
      completeStatuses: [TransactionStatusEnum.success],
    });

    // Assert
    expect(approvePaymentResponse.status).toBe(HttpStatus.CREATED);
    expect(startPaymentResponse.status).toBe(HttpStatus.ACCEPTED);

    const getTransactionsResultFinal =
      await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        accessToken: adminAccessToken,
      });
    expect(getTransactionsResultFinal.status).toBe(HttpStatus.OK);
    expect(getTransactionsResultFinal.body.data[0].status).toBe(
      TransactionStatusEnum.success,
    );
  });

  it('should create right approval payment events, including note', async () => {
    const note = '2nd approval note';

    // Act
    // 1st approve
    await approvePayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });

    // 2nd approve
    await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
      note,
    });

    // Assert
    const getPaymentEventsResponse = await getPaymentEvents({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    const { data } = getPaymentEventsResponse.body;
    const approveEvents = data.filter(
      (event) => event.type === PaymentEvent.approved,
    );
    expect(approveEvents.length).toBe(2);
    // payment-events are returned newest first
    expect(approveEvents[1].attributes).toMatchObject({
      [PaymentEventAttributeKey.approveRank]: '1',
      [PaymentEventAttributeKey.approveTotal]: '2',
    });
    expect(approveEvents[0].attributes).toMatchObject({
      [PaymentEventAttributeKey.approveRank]: '2',
      [PaymentEventAttributeKey.approveTotal]: '2',
      [PaymentEventAttributeKey.note]: note,
    });
  });

  it('should throw on 2nd approve when 1st approver has not yet approved', async () => {
    // Act
    // 2nd approve without 1st approve
    const approvePaymentResponseFinanceManager = await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Assert
    expect(approvePaymentResponseFinanceManager.status).toBe(
      HttpStatus.BAD_REQUEST,
    );
    expect(
      approvePaymentResponseFinanceManager.body.message,
    ).toMatchInlineSnapshot(
      `"Cannot approve payment before lower-order approvers have approved"`,
    );
  });

  it('should not allow starting payment before all approvers have approved', async () => {
    // Act
    // 1st approve
    await approvePayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });

    // start payment before 2nd approve
    const startPaymentResponse = await startPayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });

    // Assert
    expect(startPaymentResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(startPaymentResponse.body.message).toMatchInlineSnapshot(
      `"Cannot start payment. There are 1 approval(s) to be done for this payment."`,
    );
  });
});

describe('do payment with <2 approvers', () => {
  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    adminAccessToken = await getAccessToken();
    await seedIncludedRegistrations(
      [registrationPV5],
      programId,
      adminAccessToken,
    );
  });

  it('user who can create a payment is different from user approving payment and different from user starting payment', async () => {
    // Arrange
    await resetDB(SeedScript.nlrcMultiple, __filename);
    adminAccessToken = await getAccessToken();
    await seedIncludedRegistrations(
      [registrationPV5],
      programId,
      adminAccessToken,
    );
    const registrationAh = { ...registrationPV5, maxPayments: 1 };

    const accessTokenCvaManager = await getAccessTokenCvaManager();
    const accessTokenFinanceManager = await getAccessTokenFinanceManager();

    // Set up admin user as approver
    const adminUser = await getCurrentUser({ accessToken: adminAccessToken });
    await replaceProgramApprovalThresholds({
      programId,
      thresholds: [
        {
          thresholdAmount: 0,
          userIds: [adminUser.body.user.id],
        },
      ],
      accessToken: adminAccessToken,
    });

    // Act
    // create (both cva & finance can)
    const createPaymentResponseFinanceManager = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationAh.referenceId],
      accessToken: accessTokenFinanceManager,
    });
    const createPaymentResponseCvaManager = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationAh.referenceId],
      accessToken: accessTokenCvaManager,
    });

    // approve (admin can, cva & finance cannot)
    const paymentId = createPaymentResponseCvaManager.body.id;
    const approvePaymentResponseCvaManager = await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenCvaManager,
    });
    const approvePaymentResponseAdmin = await approvePayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });

    // start (only finance can)
    const startPaymentResponseCvaManager = await startPayment({
      programId,
      paymentId,
      accessToken: accessTokenCvaManager,
    });
    const startPaymentResponseFinanceManager = await startPayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Wait for payment transactions to complete to cleanup in progress stuff
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentId,
      paymentReferenceIds: [registrationAh.referenceId],
      accessToken: adminAccessToken,
      maxWaitTimeMs: 5000,
      completeStatuses: [TransactionStatusEnum.success],
    });

    // Assert
    // Cva manager can only create a payment and a finance manager can create and start a payment
    expect(createPaymentResponseCvaManager.status).toBe(HttpStatus.CREATED);
    expect(createPaymentResponseFinanceManager.status).toBe(HttpStatus.CREATED);
    // CVA manager has assignment but isn't designated as approver for this payment
    expect(approvePaymentResponseCvaManager.status).toBe(HttpStatus.FORBIDDEN);
    expect(approvePaymentResponseAdmin.status).toBe(HttpStatus.CREATED);
    expect(startPaymentResponseCvaManager.status).toBe(HttpStatus.FORBIDDEN);
    expect(startPaymentResponseFinanceManager.status).toBe(HttpStatus.ACCEPTED);
  });

  it('should throw on create payment when no approvers configured for program', async () => {
    // Arrange
    // Remove all approver thresholds
    await replaceProgramApprovalThresholds({
      programId,
      thresholds: [],
      accessToken: adminAccessToken,
    });

    // Act
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken: adminAccessToken,
    });

    // Assert
    expect(createPaymentResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(createPaymentResponse.body.message).toMatchInlineSnapshot(
      `"No approval thresholds found for this payment amount, cannot create payment"`,
    );
  });

  it('should throw when trying to create thresholds with duplicate amounts', async () => {
    // Arrange
    const thresholdsWithDuplicates = [
      {
        thresholdAmount: 100,

        userIds: [1],
      },
      {
        thresholdAmount: 100, // Duplicate!

        userIds: [2],
      },
    ];

    // Act
    const response = await replaceProgramApprovalThresholds({
      programId,
      thresholds: thresholdsWithDuplicates,
      accessToken: adminAccessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toMatchInlineSnapshot(
      `"Threshold amounts must be unique. Cannot have multiple thresholds with the same amount."`,
    );
  });

  it('should return all payment approvals but without username for deleted approver(s)', async () => {
    const accessTokenFinanceManager = await getAccessTokenFinanceManager();
    const financeManagerUser = await getCurrentUser({
      accessToken: accessTokenFinanceManager,
    });

    // Get admin user ID
    const adminUser = await getCurrentUser({
      accessToken: adminAccessToken,
    });

    const updatedThresholds = [
      {
        thresholdAmount: 0,

        userIds: [adminUser.body.user.id],
      },
      {
        thresholdAmount: 10,

        userIds: [financeManagerUser.body.user.id],
      },
    ];

    await replaceProgramApprovalThresholds({
      programId,
      thresholds: updatedThresholds,
      accessToken: adminAccessToken,
    });

    // create payment (this creates approval records)
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken: adminAccessToken,
    });

    // Remove the 2nd approver by replacing thresholds without finance manager
    const thresholdsWithoutFinanceManager = [
      {
        thresholdAmount: 0,

        userIds: [adminUser.body.user.id],
      },
    ];

    await replaceProgramApprovalThresholds({
      programId,
      thresholds: thresholdsWithoutFinanceManager,
      accessToken: adminAccessToken,
    });

    // Act
    const getPaymentResponse = await getPaymentSummary({
      programId,
      paymentId: createPaymentResponse.body.id,
      accessToken: adminAccessToken,
    });

    // Assert
    expect(getPaymentResponse.status).toBe(HttpStatus.OK);
    expect(getPaymentResponse.body.approvalStatus.length).toBe(2);
    // With junction table approach, approvers are preserved even after threshold config changes
    expect(getPaymentResponse.body.approvalStatus[1].approvers).toEqual([
      'finance-manager@example.org',
    ]);
  });

  it('should include note in payment approved event', async () => {
    // Arrange
    const note = 'Payment approved for testing purposes only.';

    // Set up admin user as approver
    const adminUser = await getCurrentUser({ accessToken: adminAccessToken });
    await replaceProgramApprovalThresholds({
      programId,
      thresholds: [
        {
          thresholdAmount: 0,
          userIds: [adminUser.body.user.id],
        },
      ],
      accessToken: adminAccessToken,
    });

    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken: adminAccessToken,
    });

    // Act
    const paymentId = createPaymentResponse.body.id;
    await approvePayment({
      programId,
      paymentId,
      note,
      accessToken: adminAccessToken,
    });

    const paymentEventsResponse = await getPaymentEvents({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });

    // Assert
    expect(paymentEventsResponse.statusCode).toBe(HttpStatus.OK);

    const { data } = paymentEventsResponse.body;
    const approvedEvent = data.find(
      (event) => event.type === PaymentEvent.approved,
    );
    expect(approvedEvent).toBeDefined();
    expect(approvedEvent.attributes.note).toBe(note);
  });
});

describe('multiple approvers per threshold', () => {
  let accessTokenFinanceManager: string;
  let accessTokenCvaManager: string;
  let paymentId: number;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    adminAccessToken = await getAccessToken();
    await seedIncludedRegistrations(
      [registrationPV5],
      programId,
      adminAccessToken,
    );

    accessTokenFinanceManager = await getAccessTokenFinanceManager();
    accessTokenCvaManager = await getAccessTokenCvaManager();

    const financeManagerUser = await getCurrentUser({
      accessToken: accessTokenFinanceManager,
    });
    const cvaManagerUser = await getCurrentUser({
      accessToken: accessTokenCvaManager,
    });

    // Create 1 threshold with 2 approvers (FinanceManager and CVAManager)
    const updatedThresholds = [
      {
        thresholdAmount: 0,

        userIds: [financeManagerUser.body.user.id, cvaManagerUser.body.user.id],
      },
    ];

    await replaceProgramApprovalThresholds({
      programId,
      thresholds: updatedThresholds,
      accessToken: adminAccessToken,
    });
  });

  beforeEach(async () => {
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken: adminAccessToken,
    });
    paymentId = createPaymentResponse.body.id;
  });

  it('should allow first approver from threshold to approve payment', async () => {
    // Arrange
    const paymentSummaryBefore = await getPaymentSummary({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(paymentSummaryBefore.body).toMatchObject({
      isPaymentApproved: false,
      approvalsGiven: 0,
      approvalsRequired: 1,
    });

    // Act - Finance Manager approves
    const approveResponse = await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Assert
    expect(approveResponse.statusCode).toBe(HttpStatus.CREATED);

    const paymentSummaryAfter = await getPaymentSummary({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(paymentSummaryAfter.body).toMatchObject({
      isPaymentApproved: true,
      approvalsGiven: 1,
      approvalsRequired: 1,
    });

    const startResponse = await startPayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(startResponse.statusCode).toBe(HttpStatus.ACCEPTED);

    // Wait for payment to complete to avoid interference with next test
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentId,
      paymentReferenceIds: [registrationPV5.referenceId],
      accessToken: adminAccessToken,
      maxWaitTimeMs: 5000,
      completeStatuses: [TransactionStatusEnum.success],
    });
  });

  it('should prevent second approver from same threshold from approving again', async () => {
    // Arrange - Finance Manager approves first
    await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Act - CVA Manager tries to approve the same threshold
    const secondApprovalResponse = await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenCvaManager,
    });

    // Assert
    expect(secondApprovalResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(secondApprovalResponse.body.message).toBe(
      'This threshold has already been approved for this payment',
    );
  });
});
