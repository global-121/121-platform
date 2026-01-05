import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  approvePayment,
  createPayment,
  getTransactionsByPaymentIdPaginated,
  startPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  createApprover,
  deleteApprover,
  getCurrentUser,
} from '@121-service/test/helpers/user.helper';
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
describe('Payment approval flow', () => {
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
    const registrationAh = { ...registrationPV5, maxPayments: 1 };

    const accessTokenCvaManager = await getAccessTokenCvaManager();
    const accessTokenFinanceManager = await getAccessTokenFinanceManager();

    // Act
    // create
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

    // approve
    const paymentId = createPaymentResponseCvaManager.body.id;
    const approvePaymentResponseCvaManager = await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenCvaManager,
    });
    const approvePaymentResponseFinanceManager = await approvePayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });
    const approvePaymentResponseAdmin = await approvePayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });

    // start
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
    await waitForPaymentTransactionsToComplete({
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
    expect(approvePaymentResponseCvaManager.status).toBe(HttpStatus.FORBIDDEN);
    expect(approvePaymentResponseFinanceManager.status).toBe(
      HttpStatus.FORBIDDEN,
    );
    expect(approvePaymentResponseAdmin.status).toBe(HttpStatus.CREATED);
    expect(startPaymentResponseCvaManager.status).toBe(HttpStatus.FORBIDDEN);
    expect(startPaymentResponseFinanceManager.status).toBe(HttpStatus.ACCEPTED);
  });

  describe('do payment with 2 approvers', () => {
    let accessTokenFinanceManager: string;

    beforeEach(async () => {
      // configure 2nd approver
      accessTokenFinanceManager = await getAccessTokenFinanceManager();
      const financeManagerUserId = (
        await getCurrentUser({
          accessToken: accessTokenFinanceManager,
        })
      ).body.user.id;
      await createApprover({
        programId,
        userId: financeManagerUserId,
        order: 2,
        accessToken: adminAccessToken,
      });
    });

    it('should successfully do payment', async () => {
      // Arrange
      const createPaymentResponse = await createPayment({
        programId,
        transferValue,
        referenceIds: [registrationPV5.referenceId],
        accessToken: adminAccessToken,
      });

      // Act
      // 1st approve
      const paymentId = createPaymentResponse.body.id;
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

      // 2nd approve
      await approvePayment({
        programId,
        paymentId,
        accessToken: accessTokenFinanceManager,
      });

      const startPaymentResponse = await startPayment({
        programId,
        paymentId,
        accessToken: adminAccessToken,
      });
      await waitForPaymentTransactionsToComplete({
        programId,
        paymentId,
        paymentReferenceIds: [registrationPV5.referenceId],
        accessToken: adminAccessToken,
        maxWaitTimeMs: 5000,
        completeStatuses: [TransactionStatusEnum.success],
      });

      // Assert
      expect(createPaymentResponse.status).toBe(HttpStatus.CREATED);
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

    it('should throw on 2nd approve when 1st approver has not yet approved', async () => {
      // Arrange
      const createPaymentResponse = await createPayment({
        programId,
        transferValue,
        referenceIds: [registrationPV5.referenceId],
        accessToken: adminAccessToken,
      });

      // Act
      // 2nd approve without 1st approve
      const paymentId = createPaymentResponse.body.id;
      const approvePaymentResponseFinanceManager = await approvePayment({
        programId,
        paymentId,
        accessToken: accessTokenFinanceManager,
      });

      // Assert
      expect(createPaymentResponse.status).toBe(HttpStatus.CREATED);
      expect(approvePaymentResponseFinanceManager.status).toBe(
        HttpStatus.BAD_REQUEST,
      );
      expect(
        approvePaymentResponseFinanceManager.body.message,
      ).toMatchInlineSnapshot(
        `"Cannot approve payment before lower-order approvers have approved"`,
      );
    });
  });

  it('should throw on create payment when no approvers configured for program', async () => {
    // Arrange
    await deleteApprover({
      programId,
      approverId: 1, // admin-user approver
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
      `"No approvers found for program, cannot create payment"`,
    );
  });
});
