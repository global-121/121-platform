import { HttpStatus } from '@nestjs/common';

import { MtnMockReferenceId } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-mock-reference-id.enum';
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

const expectedEventsForSyncError = [
  TransactionEventDescription.created,
  TransactionEventDescription.approval,
  TransactionEventDescription.initiated,
  TransactionEventDescription.mtnRequestSent,
];

const expectedEventsForCallbackResult = [
  ...expectedEventsForSyncError,
  TransactionEventDescription.mtnCallbackReceived,
];

const expectedEventsForRetrySuccess = [
  ...expectedEventsForSyncError,
  TransactionEventDescription.retry,
  TransactionEventDescription.mtnRequestSent,
  TransactionEventDescription.mtnCallbackReceived,
];

describe('Do payment with FSP: MTN', () => {
  let accessToken: string;

  beforeAll(async () => {
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
    expect(transactionEventDescriptions).toEqual(
      expectedEventsForCallbackResult,
    );
  });

  it('should yield error transaction when the MTN API returns an internal error', async () => {
    // Arrange
    const registration = {
      ...registrationMtn,
      phoneNumberPayment: '100000002', // Triggers failInternalError in the mock service
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
      `"MTN API Error: Failed to create transfer. Status: 500, StatusText: Internal Server Error, Body: {"code":"INTERNAL_PROCESSING_ERROR","message":"Internal error."}"`,
    );

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForSyncError);
  });

  it('should yield error transaction when transfer is accepted but callback indicates failure due to invalid phone number', async () => {
    // Arrange: the transfer is accepted (202), but getTransfer returns FAILED
    // with PAYEE_NOT_FOUND. This simulates a real-world scenario where the
    // disbursement is accepted initially but later fails (e.g., invalid recipient).
    // The mock referenceId drives the failure scenario statelessly.
    const registration = {
      ...registrationMtn,
      referenceId: MtnMockReferenceId.failPayeeNotFound,
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
    expect(transaction.errorMessage).toBe('PAYEE_NOT_FOUND');

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(
      expectedEventsForCallbackResult,
    );
  });

  it('should resolve to success when the MTN API returns a duplicate conflict on queue retry', async () => {
    // Arrange: the mock simulates a queue retry where the original transfer succeeded.
    // MTN returns 409 CONFLICT, then getTransfer returns SUCCESSFUL.
    const registration = {
      ...registrationMtn,
      phoneNumberPayment: '100000001', // Triggers failDuplicate in the mock service
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

    // The duplicate handler queries getTransfer, which returns SUCCESSFUL
    expect(transaction.status).toBe(TransactionStatusEnum.success);
    expect(transaction.errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForSyncError);
  });

  it('should successfully retry pay-out after an initial failure', async () => {
    // Arrange
    const registration = {
      ...registrationMtn,
      phoneNumberPayment: '100000002', // Triggers failInternalError in the mock service
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
      { phoneNumberPayment: registrationMtn.phoneNumberPayment },
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
    expect(transactionEventDescriptions).toEqual(expectedEventsForRetrySuccess);
  });
});
