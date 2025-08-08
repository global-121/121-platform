import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationAirtel } from '@121-service/test/registrations/pagination/pagination-data';

const programId = 1;
const amount = 200;

describe('Do payment with FSP: Airtel', () => {
  let accessToken: string;
  beforeAll(async () => {
    await resetDB(SeedScript.airtelProgram, __filename);
    accessToken = await getAccessToken();
  });

  it('should succesfully initiate a payment', async () => {
    // Arrange
    const registrationAirtelInitiatePayment = {
      ...registrationAirtel,
      referenceId: 'airtel-initiate-payment',
    };
    const paymentReferenceIds = [registrationAirtelInitiatePayment.referenceId];

    await seedIncludedRegistrations(
      [registrationAirtelInitiatePayment],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 30_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
        TransactionStatusEnum.waiting,
      ],
    });

    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(doPaymentResponse.body.totalFilterCount).toBe(
      paymentReferenceIds.length,
    );
    expect(doPaymentResponse.body.nonApplicableCount).toBe(0);
    expect(doPaymentResponse.body.sumPaymentAmountMultiplier).toBe(
      registrationAirtelInitiatePayment.paymentAmountMultiplier,
    );
  });
  // Arrange

  it('should successfully do a payment', async () => {
    // Arrange
    const registrationAirtelSuccessTransaction = {
      ...registrationAirtel,
      referenceId: 'airtel-success-transaction',
    };

    const paymentReferenceIds = [
      registrationAirtelSuccessTransaction.referenceId,
    ];
    await seedIncludedRegistrations(
      [registrationAirtelSuccessTransaction],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 30_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
        TransactionStatusEnum.waiting,
      ],
    });
    const getTransactionsResult = await getTransactions({
      programId,
      paymentId,
      registrationReferenceId: registrationAirtelSuccessTransaction.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body[0];

    // Assert
    expect(transaction.errorMessage).toBe(null);
    expect(transaction.status).toBe(TransactionStatusEnum.success);
  });

  it('should correctly handle duplicate Airtel transactionId', async () => {
    // Arrange
    const registrationAirtelDuplicateTransactionId = {
      ...registrationAirtel,
      phoneNumber: '260000000001',
      referenceId: 'airtel-duplicate-transaction-id',
    };
    const paymentReferenceIds = [
      registrationAirtelDuplicateTransactionId.referenceId,
    ];
    await seedIncludedRegistrations(
      [registrationAirtelDuplicateTransactionId],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 30_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
        TransactionStatusEnum.waiting,
      ],
    });
    const getTransactionsResult = await getTransactions({
      programId,
      paymentId,
      registrationReferenceId:
        registrationAirtelDuplicateTransactionId.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body[0];

    // Assert

    expect(transaction.errorMessage).toBe(null);
    expect(transaction.status).toBe(TransactionStatusEnum.success);
  });

  it('should create a transaction with status error when we do a payment with an invalid phonenumber', async () => {
    // Arrange
    const registrationAirtelDuplicateTransactionId = {
      ...registrationAirtel,
      phoneNumber: '260000000002',
      referenceId: 'airtel-invalid-phonenumber',
    };
    const paymentReferenceIds = [
      registrationAirtelDuplicateTransactionId.referenceId,
    ];
    await seedIncludedRegistrations(
      [registrationAirtelDuplicateTransactionId],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 30_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
        TransactionStatusEnum.waiting,
      ],
    });
    const getTransactionsResult = await getTransactions({
      programId,
      paymentId,
      registrationReferenceId:
        registrationAirtelDuplicateTransactionId.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body[0];

    // Assert
    expect(transaction.errorMessage).toMatchSnapshot();
    expect(transaction.status).toBe(TransactionStatusEnum.error);
  });

  it('should create a transaction with status waiting when we get an Ambiguous error from Airtel', async () => {
    // Arrange
    const registrationAirtelAmbiguousError = {
      ...registrationAirtel,
      phoneNumber: '260000000003',
      referenceId: 'airtel-ambiguous-error',
    };
    const paymentReferenceIds = [registrationAirtelAmbiguousError.referenceId];
    await seedIncludedRegistrations(
      [registrationAirtelAmbiguousError],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 30_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
        TransactionStatusEnum.waiting,
      ],
    });
    const getTransactionsResult = await getTransactions({
      programId,
      paymentId,
      registrationReferenceId: registrationAirtelAmbiguousError.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body[0];

    // Assert
    expect(transaction.status).toBe(TransactionStatusEnum.waiting);
    expect(transaction.errorMessage).toMatch(
      /^Airtel Error: Please use the Airtel Mobiquity portal to find out the status of the transaction. Airtel transaction id: [a-z0-9]{64} - Status: Ambiguous/,
    );
  });
});
