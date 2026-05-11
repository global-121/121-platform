import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactionsByPaymentIdPaginated,
  retryPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  getTransactionEventDescriptions,
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationMtn } from '@121-service/test/registrations/pagination/pagination-data';

const programId = 1;
const transferValue = 10;

describe('Do payment with FSP: MTN', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.mtnProgram });
    accessToken = await getAccessToken();
  });

  it('should successfully initiate a payment', async () => {
    // Arrange
    const registration = {
      ...registrationMtn,
      referenceId: 'mtn-initiate-payment',
    };
    const paymentReferenceIds = [registration.referenceId];

    await seedIncludedRegistrations([registration], programId, accessToken);

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.success],
    });

    // Assert

    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registration.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    // The mock service sends a callback, so the transaction should reach 'success'
    expect(transaction.status).toBe(TransactionStatusEnum.success);
    expect(transaction.errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.mtnRequestSent,
      TransactionEventDescription.mtnCallbackReceived,
    ]);
  });

  it('should yield error transaction when the MTN API returns an internal error', async () => {
    // Arrange
    const registration = {
      ...registrationMtn,
      phoneNumber: '100000002', // Triggers failInternalError in the mock service
      referenceId: 'mtn-error-transaction',
    };
    const paymentReferenceIds = [registration.referenceId];

    await seedIncludedRegistrations([registration], programId, accessToken);

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [
        TransactionStatusEnum.error,
        TransactionStatusEnum.success,
      ],
    });

    // Assert

    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registration.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    expect(transaction.status).toBe(TransactionStatusEnum.error);
    expect(transaction.errorMessage).toMatchInlineSnapshot(
      `"MTN API Error: Failed to create transfer. Status: 500, StatusText: Internal Server Error, Code: INTERNAL_PROCESSING_ERROR, Message: Internal error."`,
    );

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.mtnRequestSent,
    ]);
  });

  it('should yield error transaction when the MTN callback indicates a failed transfer', async () => {
    // Arrange: the transfer is accepted (202), but getTransferStatus returns FAILED.
    // This simulates a real-world scenario where the disbursement is accepted
    // initially but later fails (e.g., invalid recipient).
    const registration = {
      ...registrationMtn,
      phoneNumber: '100000003', // Triggers failCallback in the mock service
      referenceId: 'mtn-failed-callback',
    };
    const paymentReferenceIds = [registration.referenceId];

    await seedIncludedRegistrations([registration], programId, accessToken);

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.error],
    });

    // Assert
    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registration.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    expect(transaction.status).toBe(TransactionStatusEnum.error);
    expect(transaction.errorMessage).toBe('PAYER_NOT_FOUND');

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.mtnRequestSent,
      TransactionEventDescription.mtnCallbackReceived,
    ]);
  });

  it('should resolve to success when the MTN API returns a duplicate conflict on queue retry', async () => {
    // Arrange: the mock simulates a queue retry where the original transfer succeeded.
    // MTN returns 409 CONFLICT, then getTransferStatus returns SUCCESSFUL.
    const registration = {
      ...registrationMtn,
      phoneNumber: '100000001', // Triggers failDuplicate in the mock service
      referenceId: 'mtn-duplicate-transaction',
    };
    const paymentReferenceIds = [registration.referenceId];

    await seedIncludedRegistrations([registration], programId, accessToken);

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [
        TransactionStatusEnum.error,
        TransactionStatusEnum.success,
      ],
    });

    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);

    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registration.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    // The duplicate handler queries getTransferStatus, which returns SUCCESSFUL
    expect(transaction.status).toBe(TransactionStatusEnum.success);
    expect(transaction.errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.mtnRequestSent,
    ]);
  });

  it('should successfully retry pay-out after an initial failure', async () => {
    // Arrange
    const registration = {
      ...registrationMtn,
      phoneNumber: '100000002', // Triggers failInternalError in the mock service
      referenceId: 'mtn-retry-payment',
    };
    const paymentReferenceIds = [registration.referenceId];

    await seedIncludedRegistrations([registration], programId, accessToken);

    // Act: initial failing payment
    const doPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.error],
    });

    // Update registration to a working phone number
    await updateRegistration(
      programId,
      registration.referenceId,
      { phoneNumber: registrationMtn.phoneNumber },
      'automated test',
      accessToken,
    );

    // Retry payment
    await retryPayment({
      programId,
      paymentId,
      accessToken,
    });
    await waitFor(2_000);

    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);

    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registration.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    expect(transaction.status).toBe(TransactionStatusEnum.success);
    expect(transaction.errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.mtnRequestSent,
      TransactionEventDescription.retry,
      TransactionEventDescription.mtnRequestSent,
      TransactionEventDescription.mtnCallbackReceived,
    ]);
  });
});
