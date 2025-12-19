import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
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

describe('Do payment to 1 PA with Fsp Onafriq', () => {
  const programId = 1;
  const transferValue = 12327;
  const baseRegistrationOnafriq = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    programFspConfigurationName: Fsps.onafriq,
    phoneNumber: '24311111111',
    phoneNumberPayment: '24322222222',
    preferredLanguage: RegistrationPreferredLanguage.en,
    paymentAmountMultiplier: 1,
    maxPayments: 6,
    firstName: 'Barbara',
    lastName: 'Floyd',
    gender: 'male',
    age: 25,
  };
  let registrationOnafriq;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.onafriqProgram, __filename);
    accessToken = await getAccessToken();
    registrationOnafriq = { ...baseRegistrationOnafriq };
  });

  it('should successfully pay-out', async () => {
    // Arrange
    await seedIncludedRegistrations(
      [registrationOnafriq],
      programId,
      accessToken,
    );
    const paymentReferenceIds = [registrationOnafriq.referenceId];

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
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const getTransactionsBody = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationOnafriq.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body.data[0].status).toBe(
      TransactionStatusEnum.success,
    );
    expect(getTransactionsBody.body.data[0].errorMessage).toBe(null);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: getTransactionsBody.body.data[0].id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.onafriqRequestSent,
      TransactionEventDescription.onafriqCallbackReceived,
    ]);
  });

  it('should give error on the initial request based on magic phonenumber and succeed on retry', async () => {
    // Arrange
    registrationOnafriq.phoneNumberPayment = '24300000000'; // this magic number is configured in mock to return an error on request
    await seedIncludedRegistrations(
      [registrationOnafriq],
      programId,
      accessToken,
    );
    const paymentReferenceIds = [registrationOnafriq.referenceId];

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
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const getTransactionsBody = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationOnafriq.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body.data[0].status).toBe(
      TransactionStatusEnum.error,
    );
    expect(getTransactionsBody.body.data[0].errorMessage).toMatchSnapshot();

    // RETRY
    // Arrange
    await updateRegistration(
      programId,
      registrationOnafriq.referenceId,
      { phoneNumberPayment: '24333333333' }, // change to a number that will succeed
      'test reason',
      accessToken,
    );

    // Act
    const retryResponse = await retryPayment({
      programId,
      paymentId,
      accessToken,
    });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4000,
      completeStatuses: [TransactionStatusEnum.success],
    });

    // Assert
    const getTransactionsAfterRetryBody =
      await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        registrationReferenceId: registrationOnafriq.referenceId,
        accessToken,
      });
    expect(retryResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(retryResponse.body.applicableCount).toBe(paymentReferenceIds.length);
    expect(getTransactionsAfterRetryBody.body.data[0].status).toBe(
      TransactionStatusEnum.success,
    );

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: getTransactionsBody.body.data[0].id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.onafriqRequestSent,
      TransactionEventDescription.retry,
      TransactionEventDescription.onafriqRequestSent,
      TransactionEventDescription.onafriqCallbackReceived,
    ]);
  });

  it('should give error via callback based on magic phonenumber', async () => {
    // Arrange
    registrationOnafriq.phoneNumberPayment = '24300000002'; // this magic number is configured in mock to return an error on callback
    await seedIncludedRegistrations(
      [registrationOnafriq],
      programId,
      accessToken,
    );
    const paymentReferenceIds = [registrationOnafriq.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    // wait for non-waiting transactions only, to make sure callback came in
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const getTransactionsBody = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationOnafriq.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body.data[0].status).toBe(
      TransactionStatusEnum.error,
    );
    expect(getTransactionsBody.body.data[0].errorMessage).toMatchSnapshot();

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: getTransactionsBody.body.data[0].id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
      TransactionEventDescription.onafriqRequestSent,
      TransactionEventDescription.onafriqCallbackReceived,
    ]);
  });

  it('should not update transaction on a `duplicate thirdPartyTransId error` API response', async () => {
    // Arrange
    // NOTE 1: we use a magic phone number here that is configured in the mock to return a duplicate thirdPartyTransId error on request.
    // We use this as we cannot actually easily test a duplicate thirdPartyTransId error in the mock.
    registrationOnafriq.phoneNumberPayment = '24300000001';
    await seedIncludedRegistrations(
      [registrationOnafriq],
      programId,
      accessToken,
    );
    const paymentReferenceIds = [registrationOnafriq.referenceId];

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
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: Object.values(TransactionStatusEnum), // this deliberatedly includes 'created' as in this scenario nothing happens to the original transaction so it stays on 'created'
    });

    // Assert
    // NOTE 2: We also assert that no callback comes in, so we must give some time for the callback to potentially come in, as the assertion is not valuable otherwise.
    await waitFor(1_000);

    const getTransactionsBody = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationOnafriq.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    // NOTE 3: this is the critical assertion, as in case of a duplicate thirdPartyTransId error, the transaction should not be updated to an error status.
    // This test is not following the real-life use case of making 2 calls, but does test the different handling in the code of this type of error.
    expect(getTransactionsBody.body.data[0].status).toBe(
      TransactionStatusEnum.waiting,
    );

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId,
      transactionId: getTransactionsBody.body.data[0].id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.approval,
      TransactionEventDescription.initiated,
    ]);
  });
});
