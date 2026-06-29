import { HttpStatus } from '@nestjs/common';

import { MtnMockReferenceId } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-mock-reference-id.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  getTransactionsByPaymentIdPaginated,
  retryPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getTransactionEventDescriptions,
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  runCronJobDoMtnReconciliation,
} from '@121-service/test/helpers/utility.helper';
import {
  registrationMtn,
  registrationNedbank,
} from '@121-service/test/registrations/pagination/pagination-data';

const programId = 1;
const transferValue = 10;

const expectedEventsForSyncError = [
  TransactionEventDescription.created,
  TransactionEventDescription.approval,
  TransactionEventDescription.initiated,
  TransactionEventDescription.mtnRequestSent,
];

const expectedEventsForCallbackResult = [
  TransactionEventDescription.created,
  TransactionEventDescription.approval,
  TransactionEventDescription.initiated,
  TransactionEventDescription.mtnRequestSent,
  TransactionEventDescription.mtnReconciliationProcessed,
];

const expectedEventsForRetrySuccess = [
  ...expectedEventsForSyncError,
  TransactionEventDescription.retry,
  TransactionEventDescription.mtnRequestSent,
  TransactionEventDescription.mtnReconciliationProcessed,
];

const expectedEventsForRetryReconciliationError = [
  ...expectedEventsForCallbackResult,
  TransactionEventDescription.retry,
  TransactionEventDescription.mtnRequestSent,
  TransactionEventDescription.mtnReconciliationProcessed,
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
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    // Trigger MTN reconciliation cronjob to poll for the latest transfer status
    await runCronJobDoMtnReconciliation();

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
    // Wait for the retry to reach waiting status (transfer accepted by MTN)
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    // Trigger MTN reconciliation cronjob to poll for the latest transfer status
    await runCronJobDoMtnReconciliation();

    // Wait for the retry to complete, which should now succeed with the corrected phone number
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.success],
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

    expect(transaction.status).toBe(TransactionStatusEnum.success);
    expect(transaction.errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForRetrySuccess);
  });

  it('should re-enqueue the same transaction on retry when MTN keeps returning a failed status', async () => {
    // Arrange: the transfer is accepted (202) and reaches waiting, but the
    // reconciliation status check returns FAILED. After a retry it reaches
    // waiting again and reconciliation re-enqueues the SAME transactionId,
    // proving a completed reconciliation job does not block re-enqueueing
    // (deterministic jobId + Bull removeOnComplete/removeOnFail regression).
    const registration = {
      ...registrationMtn,
      referenceId: MtnMockReferenceId.failPayeeNotFound,
    };
    const paymentReferenceIds = [registration.referenceId];

    await seedIncludedRegistrations([registration], programId, accessToken);

    // Act: initial payment, fails at reconciliation status check
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
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    await runCronJobDoMtnReconciliation();

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.error],
    });

    // Retry payment: the same transactionId is enqueued for reconciliation again
    await retryPayment({
      programId,
      paymentId,
      accessToken,
    });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    // Trigger MTN reconciliation cronjob again for the same transactionId
    await runCronJobDoMtnReconciliation();

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.error],
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

    expect(transaction.status).toBe(TransactionStatusEnum.error);
    expect(transaction.errorMessage).toBe('PAYEE_NOT_FOUND');

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(
      expectedEventsForRetryReconciliationError,
    );
  });

  it('should only reconcile waiting MTN transactions and report the count', async () => {
    // Arrange: one MTN registration already reconciled to success, one MTN left
    // waiting, and one Nedbank registration left waiting. Only the waiting MTN
    // transaction should be reconciled, proving the FSP scoping of the query.
    const successRegistration = {
      ...registrationMtn,
      referenceId: 'mtn-recon-already-success',
    };
    const waitingRegistration = {
      ...registrationMtn,
      referenceId: 'mtn-recon-still-waiting',
    };

    // Add a Nedbank FSP configuration so a Nedbank registration can be seeded
    await postProgramFspConfiguration({
      programId,
      body: {
        name: registrationNedbank.programFspConfigurationName,
        label: { en: 'Nedbank' },
        fspName: Fsps.nedbank,
        properties: [
          {
            name: FspConfigurationProperties.paymentReferencePrefix,
            value: 'ref1',
          },
        ],
      },
      accessToken,
    });

    await seedIncludedRegistrations(
      [successRegistration, waitingRegistration, registrationNedbank],
      programId,
      accessToken,
    );

    // Pay the Nedbank registration so it sits in waiting and should be ignored
    const nedbankPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: [registrationNedbank.referenceId],
      accessToken,
    });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationNedbank.referenceId],
      paymentId: nedbankPaymentResponse.body.id,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    // Pay + reconcile the first one all the way to success
    const successPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: [successRegistration.referenceId],
      accessToken,
    });
    const successPaymentId = successPaymentResponse.body.id;
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [successRegistration.referenceId],
      paymentId: successPaymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.waiting],
    });
    await runCronJobDoMtnReconciliation();
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [successRegistration.referenceId],
      paymentId: successPaymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.success],
    });

    // Pay the second one but leave it in waiting
    const waitingPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: [waitingRegistration.referenceId],
      accessToken,
    });
    const waitingPaymentId = waitingPaymentResponse.body.id;
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [waitingRegistration.referenceId],
      paymentId: waitingPaymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    // Act: reconciliation should pick up only the single waiting transaction
    const reconciliationResponse = await runCronJobDoMtnReconciliation();

    // Assert: count is 1, despite the Nedbank transaction also being waiting,
    // proving the query is scoped to MTN
    expect(Number(reconciliationResponse.text)).toBe(1);

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [waitingRegistration.referenceId],
      paymentId: waitingPaymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.success],
    });
  });
});
