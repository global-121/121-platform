import { v4 as uuid } from 'uuid';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createAndStartPayment,
  getTransactionsByPaymentIdPaginated,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  getTransactionEventDescriptions,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationCooperativeBankOfOromia } from '@121-service/test/registrations/pagination/pagination-data';

const programId = 1;
const transferValue = 200;

// Make a unique reference ID. This is useful if you use this against the UAT environment so a different messageId is generated
const appendUuidToBaseId = (base: string) => {
  return `${base}-${uuid()}`;
};

describe('Do payment with FSP: CooperativeBankOfOromia', () => {
  let accessToken: string;
  beforeAll(async () => {
    await resetDB(SeedScript.cooperativeBankOfOromiaProgram, __filename);
    accessToken = await getAccessToken();
  });

  it('should successfully do a payment', async () => {
    // Arrange
    const registrationSuccesfulPayment = {
      ...registrationCooperativeBankOfOromia,
      referenceId: appendUuidToBaseId(
        'cooperative-bank-of-oromia-initiate-payment',
      ),
    };

    const paymentReferenceIds = [registrationSuccesfulPayment.referenceId];
    await seedIncludedRegistrations(
      [registrationSuccesfulPayment],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });
    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationSuccesfulPayment.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    // Assert
    expect(transaction.errorMessage).toBe(null);
    expect(transaction.status).toBe(TransactionStatusEnum.success);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: transaction.id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.cooperativeBankOfOromiaRequestSent,
    ]);
  });

  it('should successfully handle an error in the expected format during the payment', async () => {
    // Arrange
    const registrationFailedGenericPayment = {
      ...registrationCooperativeBankOfOromia,
      referenceId: appendUuidToBaseId(
        'cooperative-bank-of-oromia-failed-payment',
      ),
      bankAccountNumber: '1234567890', // Bank account number to trigger a generic error
    };

    const paymentReferenceIds = [registrationFailedGenericPayment.referenceId];
    await seedIncludedRegistrations(
      [registrationFailedGenericPayment],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });
    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationFailedGenericPayment.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    // Assert
    expect(transaction.status).toBe(TransactionStatusEnum.error);
    expect(transaction.errorMessage).toMatchSnapshot();
  });

  it('should successfully handle an unexpected error during the payment', async () => {
    // Arrange
    const registrationFailedUnexpectedPayment = {
      ...registrationCooperativeBankOfOromia,
      referenceId: appendUuidToBaseId(
        'cooperative-bank-of-oromia-unexpected-error-payment',
      ),
      bankAccountNumber: '1234567892', // Bank account to trigger an unexpected error
    };

    const paymentReferenceIds = [
      registrationFailedUnexpectedPayment.referenceId,
    ];
    await seedIncludedRegistrations(
      [registrationFailedUnexpectedPayment],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });
    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationFailedUnexpectedPayment.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    // Assert
    expect(transaction.status).toBe(TransactionStatusEnum.error);
    expect(transaction.errorMessage).toMatchSnapshot();
  });

  it('Should set transaction to success on a `duplicate messageId` error', async () => {
    const registrationDuplicateTransaction = {
      ...registrationCooperativeBankOfOromia,
      referenceId: appendUuidToBaseId(
        'cooperative-bank-of-oromia-duplicate-transaction',
      ),
      bankAccountNumber: '1234567891', // Bank account to trigger a duplicate error
    };

    const paymentReferenceIds = [registrationDuplicateTransaction.referenceId];
    await seedIncludedRegistrations(
      [registrationDuplicateTransaction],
      programId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });
    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationDuplicateTransaction.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    // Assert
    expect(transaction.errorMessage).toBe(null);
    expect(transaction.status).toBe(TransactionStatusEnum.success);
  });
});
