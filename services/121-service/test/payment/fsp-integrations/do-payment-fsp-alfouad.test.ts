import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
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
  runCronJobDoAlfouadReconciliation,
} from '@121-service/test/helpers/utility.helper';

const programId = 1;
const transferValue = 100;

// Phone numbers drive scenarios in the Al Fouad mock service.
const defaultPhoneNumber = '963955000001';
const phoneNumberFailBusinessError = '963000000001';
const phoneNumberFailDuplicateExisting = '963000000002';
const phoneNumberFailDuplicateMissing = '963000000003';
const phoneNumberStateApproved = '963000000011';
const phoneNumberStateCanceled = '963000000013';

const registrationAlfouad = {
  referenceId: 'registration-alfouad-1',
  phoneNumber: defaultPhoneNumber,
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  programFspConfigurationName: Fsps.alfouad,
  maxPayments: 3,
  fullName: 'John Al Fouad',
  addressCity: 'Damascus',
};

const expectedEventsForSuccess = [
  TransactionEventDescription.created,
  TransactionEventDescription.approval,
  TransactionEventDescription.initiated,
  TransactionEventDescription.alfouadRequestSent,
  TransactionEventDescription.alfouadReconciliationProcessed,
];

const expectedEventsForSyncError = [
  TransactionEventDescription.created,
  TransactionEventDescription.approval,
  TransactionEventDescription.initiated,
  TransactionEventDescription.alfouadRequestSent,
];

describe('Do payment with FSP: AlFouad', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.alFouadProgram });
    accessToken = await getAccessToken();
  });

  it('should successfully initiate a payment and reconcile it to success', async () => {
    // Arrange
    const registration = {
      ...registrationAlfouad,
      referenceId: 'alfouad-success',
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

    // Trigger Al Fouad reconciliation cronjob to poll for the latest transaction state
    await runCronJobDoAlfouadReconciliation();

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

    expect(transaction.status).toBe(TransactionStatusEnum.success);
    expect(transaction.errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForSuccess);

    // A second reconciliation run should not touch the completed transaction
    await runCronJobDoAlfouadReconciliation();

    const descriptionsAfterRerun = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(descriptionsAfterRerun).toEqual(expectedEventsForSuccess);
  });

  it('should yield error transaction when the Al Fouad API returns a business error', async () => {
    // Arrange
    const registration = {
      ...registrationAlfouad,
      phoneNumber: phoneNumberFailBusinessError, // Triggers failBusinessError in the mock service
      referenceId: 'alfouad-business-error',
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
    expect(transaction.errorMessage).toBe(
      'Transaction could not be created: beneficiary rejected',
    );

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForSyncError);
  });

  it('should resolve to waiting when the Al Fouad API reports a duplicate reference that exists', async () => {
    // Arrange: the mock simulates a queue retry where the original transaction succeeded.
    // Al Fouad returns error code 822, then TransactionByRef confirms the transaction exists.
    const registration = {
      ...registrationAlfouad,
      phoneNumber: phoneNumberFailDuplicateExisting, // Triggers failDuplicateExisting in the mock service
      referenceId: 'alfouad-duplicate-existing',
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

    // Assert: the duplicate was confirmed to exist, so no error is recorded
    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registration.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    expect(transaction.status).toBe(TransactionStatusEnum.waiting);
    expect(transaction.errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForSyncError);

    // Reconciliation then picks up the paid state from the mock
    await runCronJobDoAlfouadReconciliation();

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.success],
    });
  });

  it('should yield error transaction when the Al Fouad API reports a duplicate reference that does not exist', async () => {
    // Arrange
    const registration = {
      ...registrationAlfouad,
      phoneNumber: phoneNumberFailDuplicateMissing, // Triggers failDuplicateMissing in the mock service
      referenceId: 'alfouad-duplicate-missing',
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
    expect(transaction.errorMessage).toContain(
      'was reported but the transaction was not found',
    );

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForSyncError);
  });

  it('should keep the transaction on waiting while Al Fouad reports a non-final state', async () => {
    // Arrange
    const registration = {
      ...registrationAlfouad,
      phoneNumber: phoneNumberStateApproved, // Triggers state 'approved' in the mock service
      referenceId: 'alfouad-still-waiting',
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

    await runCronJobDoAlfouadReconciliation();

    // Assert: 'approved' is not final, so the transaction stays on 'waiting'
    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registration.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    expect(transaction.status).toBe(TransactionStatusEnum.waiting);
    expect(transaction.errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForSyncError);
  });

  it('should set the transaction to error when Al Fouad reports it as canceled', async () => {
    // Arrange
    const registration = {
      ...registrationAlfouad,
      phoneNumber: phoneNumberStateCanceled, // Triggers state 'canceled' in the mock service
      referenceId: 'alfouad-canceled',
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

    await runCronJobDoAlfouadReconciliation();

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
    expect(transaction.errorMessage).toBe(
      'The transaction was canceled at Al Fouad.',
    );

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual(expectedEventsForSuccess);
  });

  it('should successfully retry pay-out after an initial failure', async () => {
    // Arrange
    const registration = {
      ...registrationAlfouad,
      phoneNumber: phoneNumberFailBusinessError, // Triggers failBusinessError in the mock service
      referenceId: 'alfouad-retry-payment',
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
      { phoneNumber: defaultPhoneNumber },
      'automated test',
      accessToken,
    );

    // Retry payment
    await retryPayment({
      programId,
      paymentId,
      accessToken,
    });

    // The retry uses a new reference number, so Al Fouad does not block it as a duplicate
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    await runCronJobDoAlfouadReconciliation();

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
    expect(transactionEventDescriptions).toEqual([
      ...expectedEventsForSyncError,
      TransactionEventDescription.retry,
      TransactionEventDescription.alfouadRequestSent,
      TransactionEventDescription.alfouadReconciliationProcessed,
    ]);
  });
});
