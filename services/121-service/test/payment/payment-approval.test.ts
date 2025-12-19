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

  it('user who can create a payment is different from user starting payment', async () => {
    // Arrange
    const registrationAh = { ...registrationPV5, maxPayments: 1 };

    const accessTokenCvaManager = await getAccessTokenCvaManager();
    const accessTokenFinanceManager = await getAccessTokenFinanceManager();

    // Act
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

    const paymentId = createPaymentResponseCvaManager.body.id;

    await approvePayment({
      programId,
      paymentId,
      accessToken: adminAccessToken, // ##TODO: for now approve with admin. Extend this test properly.
    });

    // Start payment with CVA manager
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
    expect(createPaymentResponseCvaManager.status).toBe(HttpStatus.ACCEPTED);
    expect(createPaymentResponseFinanceManager.status).toBe(
      HttpStatus.ACCEPTED,
    );
    expect(startPaymentResponseCvaManager.status).toBe(HttpStatus.FORBIDDEN);
    expect(startPaymentResponseFinanceManager.status).toBe(HttpStatus.ACCEPTED);
  });

  // ##TODO: to start off, one simple happy flow test, with 1 approver, all with admin-user
  it('should create, approve and start a payment successfully', async () => {
    // Arrange
    const registrationAh = { ...registrationPV5 };

    // Create payment
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationAh.referenceId],
      accessToken: adminAccessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationAh.referenceId],
      accessToken: adminAccessToken,
      maxWaitTimeMs: 5000,
      completeStatuses: [TransactionStatusEnum.pendingApproval],
    });

    // Approve payment
    const paymentId = createPaymentResponse.body.id;
    const approvePaymentResponse = await approvePayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationAh.referenceId],
      accessToken: adminAccessToken,
      maxWaitTimeMs: 5000,
      completeStatuses: [TransactionStatusEnum.approved],
    });

    // Start payment
    const startPaymentResponse = await startPayment({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentId,
      paymentReferenceIds: [registrationAh.referenceId],
      accessToken: adminAccessToken,
      maxWaitTimeMs: 5000,
      completeStatuses: [TransactionStatusEnum.success],
    });

    // Assert
    expect(createPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(approvePaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(startPaymentResponse.status).toBe(HttpStatus.ACCEPTED);

    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      accessToken: adminAccessToken,
    });
    expect(getTransactionsResult.status).toBe(HttpStatus.OK);
    expect(getTransactionsResult.body.data[0].status).toBe(
      TransactionStatusEnum.success,
    );
  });
});
