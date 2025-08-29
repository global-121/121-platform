import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  getTransactions,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationCbe } from '@121-service/test/registrations/pagination/pagination-data';

const projectId = 1;
const paymentId = 1;
const amount = 200;

describe('Do payment with FSP: Commercial Bank of Ethiopia', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.cbeProject, __filename);
    accessToken = await getAccessToken();
  });

  it('when credit transfer API call gives a success response should successfully do a payment', async () => {
    // Arrange
    const paymentReferenceIds = [registrationCbe.referenceId];
    await seedIncludedRegistrations([registrationCbe], projectId, accessToken);

    // Act
    const doPaymentResponse = await doPayment({
      projectId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const getTransactionsBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationCbe.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body[0].status).toBe(
      TransactionStatusEnum.success,
    );
    expect(getTransactionsBody.body[0].errorMessage).toBe(null);
  });

  it('when credit transfer API call gives an error response should succesfully do a payment with transactions that have status error', async () => {
    // Arrange
    const paymentReferenceIds = [registrationCbe.referenceId];
    // The fullName value triggers a specific mock scenario
    const registrationCbeWithError = {
      ...registrationCbe,
      fullName: 'error',
    };

    await seedIncludedRegistrations(
      [registrationCbeWithError],
      projectId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await doPayment({
      projectId,

      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const getTransactionsBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationCbeWithError.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body[0].status).toBe(
      TransactionStatusEnum.error,
    );
    expect(getTransactionsBody.body[0].errorMessage).toMatchSnapshot();
  });

  it('when credit transfer API call times out should succesfully do a payment with transactions that have status error', async () => {
    // Arrange
    const paymentReferenceIds = [registrationCbe.referenceId];

    // The fullName value triggers a specific mock scenario
    const registrationCbeWithTimeout = {
      ...registrationCbe,
      fullName: 'time-out',
    };

    await seedIncludedRegistrations(
      [registrationCbeWithTimeout],
      projectId,
      accessToken,
    );

    // Act
    const doPaymentResponse = await doPayment({
      projectId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    // Assert
    const getTransactionsBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationCbeWithTimeout.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body[0].status).toBe(
      TransactionStatusEnum.error,
    );
    expect(getTransactionsBody.body[0].errorMessage).toMatchSnapshot();
  });

  it('when credit transfer API call returns duplicated transaction error should succesfully do a retry payment with transactions that have status success when transaction enquiry returns a success response', async () => {
    // Arrange
    const paymentReferenceIds = [registrationCbe.referenceId];

    // The fullName value triggers a specific mock scenario
    const registrationCbeWithTimeout = {
      ...registrationCbe,
      fullName: 'time-out',
    };

    await seedIncludedRegistrations(
      [registrationCbeWithTimeout],
      projectId,
      accessToken,
    );

    const doPaymentResponse = await doPayment({
      projectId,
      amount,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    const getTransactionsBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationCbeWithTimeout.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsBody.body[0].status).toBe(
      TransactionStatusEnum.error,
    );

    // Act
    const doPaymentRetryResponse = await retryPayment({
      projectId,
      paymentId,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      projectId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4000,
      completeStatusses: [TransactionStatusEnum.success],
    });

    const getTransactionsAfterRetryBody = await getTransactions({
      projectId,
      paymentId,
      registrationReferenceId: registrationCbeWithTimeout.referenceId,
      accessToken,
    });

    // Assert
    // Check if the transaction status is success.
    expect(doPaymentRetryResponse.status).toBe(HttpStatus.OK);
    expect(doPaymentRetryResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(getTransactionsAfterRetryBody.body[0].status).toBe(
      TransactionStatusEnum.success,
    );
    expect(getTransactionsAfterRetryBody.body[0].errorMessage).toBe(null);

    // TODO Implement the following test cases if we refactor CBE integration:
    // - should succesfully do a payment with transactions that have status error when transaction enquiry returns an error response
    // - should succesfully do a payment with transactions that have status error when transaction enquiry times out
  });
});
