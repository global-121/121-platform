import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventAttributeKey } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
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
import { createOrReplaceProgramApprovalThresholds } from '@121-service/test/helpers/program-approval-threshold.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenCvaManager,
  getAccessTokenFinanceManager,
  getUserIdsByUsernames,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

let adminAccessToken: string;
let accessTokenFinanceManager: string;
let accessTokenCvaManager: string;
const programId = programIdPV;
const transferValue = 25;

async function setupPaymentApprovalTest({
  thresholds,
  registrations = [registrationPV5],
}: {
  thresholds: {
    thresholdAmount: number;
    approverUsernames: string[];
  }[];
  registrations?: typeof registrationsPV;
}): Promise<void> {
  await resetDB(
    SeedScript.nlrcMultiple,
    __filename,
    false,
    ApproverSeedMode.none,
  );

  [adminAccessToken, accessTokenFinanceManager, accessTokenCvaManager] =
    await Promise.all([
      getAccessToken(),
      getAccessTokenFinanceManager(),
      getAccessTokenCvaManager(),
    ]);

  await seedIncludedRegistrations(registrations, programId, adminAccessToken);

  await setupThresholds(thresholds);
}

async function setupThresholds(
  thresholds: {
    thresholdAmount: number;
    approverUsernames: string[];
  }[],
): Promise<void> {
  const thresholdDtos = await Promise.all(
    thresholds.map(async (threshold) => {
      const userIds = await getUserIdsByUsernames({
        usernames: threshold.approverUsernames,
        programId,
        adminAccessToken,
      });
      return {
        thresholdAmount: threshold.thresholdAmount,
        userIds,
      };
    }),
  );

  await createOrReplaceProgramApprovalThresholds({
    programId,
    thresholds: thresholdDtos,
    accessToken: adminAccessToken,
  });
}

describe('do payment with 2 approval steps', () => {
  let paymentId: number;

  beforeAll(async () => {
    await setupPaymentApprovalTest({
      thresholds: [
        {
          thresholdAmount: 0,
          approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_ADMIN],
        },
        {
          thresholdAmount: 10,
          approverUsernames: [
            env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER!,
          ],
        },
      ],
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

  it('should return correct approversForCurrentApprovalStep at each stage', async () => {
    // Assert before any approvals: step 1 approver (admin) is current
    const summaryBeforeApprovals = await getPaymentSummary({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(summaryBeforeApprovals.body.approversForCurrentApprovalStep).toEqual(
      [{ username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN }],
    );

    // Act - 1st approve (admin)
    await approvePayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });

    // Assert after 1st approval: step 2 approver (finance manager) is now current
    const summaryAfter1stApproval = await getPaymentSummary({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(
      summaryAfter1stApproval.body.approversForCurrentApprovalStep,
    ).toEqual([{ username: env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER }]);

    // Act - 2nd approve (finance manager)
    await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Assert after all approvals: empty array
    const summaryAfterAllApprovals = await getPaymentSummary({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(
      summaryAfterAllApprovals.body.approversForCurrentApprovalStep,
    ).toEqual([]);
  });

  it('should throw on 2nd approval step when 1st approval step has not yet been approved', async () => {
    // Act
    // 2nd approve without 1st approve
    const approvePaymentResponseFinanceManager = await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Assert
    expect(approvePaymentResponseFinanceManager.status).toBe(
      HttpStatus.FORBIDDEN,
    );
    expect(
      approvePaymentResponseFinanceManager.body.message,
    ).toMatchInlineSnapshot(
      `"User is not assigned to the current approval step and cannot approve it"`,
    );
  });

  it('should not allow starting payment before all approval steps have been approved', async () => {
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

describe('payments with different total amounts should hit different thresholds', () => {
  // totalPaymentAmount = 4 registrations × 70 = 280
  const aggregatedTransferValue = 70;
  const referenceIds = registrationsPV.map(
    (registration) => registration.referenceId,
  );
  // Helper function to make tests cleaner.
  async function createPaymentAndGetSummary() {
    const createPaymentResponse = await createPayment({
      programId,
      transferValue: aggregatedTransferValue,
      referenceIds,
      accessToken: adminAccessToken,
    });
    const { body } = await getPaymentSummary({
      programId,
      paymentId: createPaymentResponse.body.id,
      accessToken: adminAccessToken,
    });
    return body;
  }

  it('if 1 threshold is set that should be the only hit', async () => {
    // Arrange
    await setupPaymentApprovalTest({
      registrations: registrationsPV,
      thresholds: [
        {
          thresholdAmount: 0,
          approverUsernames: [
            env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER!,
          ],
        },
      ],
    });

    // Act
    const paymentSummary = await createPaymentAndGetSummary();

    // Assert
    expect(paymentSummary).toMatchObject({
      approvalsRequired: 1,
      approvalStatus: [
        {
          approvers: [env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER],
        },
      ],
    });
  });

  it('if 2 thresholds under total amount are set both should be hit', async () => {
    // Also testing order irrelevance here.
    // Arrange
    await setupPaymentApprovalTest({
      registrations: registrationsPV,
      thresholds: [
        {
          thresholdAmount: 200, // 200 < 280, so should be hit
          approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN!],
        },
        {
          thresholdAmount: 0,
          approverUsernames: [
            env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER!,
          ],
        },
      ],
    });
    // Act
    const paymentSummary = await createPaymentAndGetSummary();

    // Assert
    expect(paymentSummary).toMatchObject({
      approvalsRequired: 2,
      approvalStatus: [
        {
          approvers: [env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER],
        },
        {
          approvers: [env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN],
        },
      ],
    });
  });

  it('if 2nd threshold is over total amount it should not be hit', async () => {
    // Arrange
    await setupPaymentApprovalTest({
      registrations: registrationsPV,
      thresholds: [
        {
          thresholdAmount: 0,
          approverUsernames: [
            env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER!,
          ],
        },
        {
          thresholdAmount: 300, // Higher than 280 total amount, so should not be hit
          approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN!],
        },
      ],
    });

    // Act
    const paymentSummary = await createPaymentAndGetSummary();

    // Assert
    expect(paymentSummary).toMatchObject({
      approvalsRequired: 1,
      approvalStatus: [
        {
          approvers: [env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER],
        },
      ],
    });
  });

  it('if 2nd threshold is under total amount and 3rd is over then only 1 and 2 should be hit', async () => {
    // Arrange
    await setupPaymentApprovalTest({
      registrations: registrationsPV,
      thresholds: [
        {
          thresholdAmount: 0,
          approverUsernames: [
            env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER!,
          ],
        },
        {
          thresholdAmount: 150, // < 280, so should be hit
          approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN!],
        },
        {
          thresholdAmount: 300, // > 280, so should not be hit
          approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER!],
        },
      ],
    });

    // Act
    const paymentSummary = await createPaymentAndGetSummary();

    // Assert
    expect(paymentSummary).toMatchObject({
      approvalsRequired: 2,
      approvalStatus: [
        {
          approvers: [env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER],
        },
        {
          approvers: [env.USERCONFIG_121_SERVICE_EMAIL_PROGRAM_ADMIN],
        },
      ],
    });
  });
});

describe('do payment with <2 approval steps', () => {
  beforeEach(async () => {
    await setupPaymentApprovalTest({ thresholds: [] });
  });

  it('user who can create a payment is different from user approving payment and different from user starting payment', async () => {
    // Arrange
    const registrationAh = { ...registrationPV5, maxPayments: 1 };

    const accessTokenCvaManager = await getAccessTokenCvaManager();
    const accessTokenFinanceManager = await getAccessTokenFinanceManager();

    await setupThresholds([
      {
        thresholdAmount: 0,
        approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_ADMIN],
      },
    ]);

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

  it('Approver can still approve a payment if this user has been removed from the program threshold configuration', async () => {
    await setupThresholds([
      {
        thresholdAmount: 0,
        approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER!],
      },
    ]);

    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken: adminAccessToken,
    });
    const paymentId = createPaymentResponse.body.id;

    // Remove financeManager from threshold config
    await setupThresholds([
      {
        thresholdAmount: 0,
        approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_ADMIN],
      },
    ]);

    // Act
    const approveResponse = await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Assert
    expect(approveResponse.status).toBe(HttpStatus.CREATED);
  });

  it('should include note in payment approved event', async () => {
    // Arrange
    const note = 'Payment approved for testing purposes only.';

    await setupThresholds([
      {
        thresholdAmount: 0,
        approverUsernames: [env.USERCONFIG_121_SERVICE_EMAIL_ADMIN],
      },
    ]);

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

describe('multiple approvers per approval step', () => {
  let paymentId: number;

  beforeAll(async () => {
    await setupPaymentApprovalTest({
      thresholds: [
        {
          thresholdAmount: 0,
          approverUsernames: [
            env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER!,
            env.USERCONFIG_121_SERVICE_EMAIL_CVA_MANAGER!,
          ],
        },
      ],
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
      'Payment is already fully approved, cannot approve it',
    );
  });
});
