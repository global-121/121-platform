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
import { registrationCbe } from '@121-service/test/registrations/pagination/pagination-data';

const programId = 1;
const payment = 1;
const amount = 200;

describe('Do payment', () => {
  describe('with FSP: Commercial Bank of Ethiopia', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.cbeProgram);
      accessToken = await getAccessToken();
    });

    describe('when credit transfer API call gives a valid response', () => {
      it('should succesfully do a payment', async () => {
        // Arrange

        const paymentReferenceIds = [registrationCbe.referenceId];
        await seedIncludedRegistrations(
          [registrationCbe],
          programId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 3001,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        });

        // Assert
        const getTransactionsBody = await getTransactions({
          programId,
          paymentNr: payment,
          referenceId: registrationCbe.referenceId,
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
    });

    describe('when credit transfer API call gives an error response', () => {
      it('should succesfully do a payment with transactions that have status error', async () => {
        // Arrange

        const paymentReferenceIds = [registrationCbe.referenceId];
        // The fullName value triggers a specific mock scenario
        const registrationCbeWithError = {
          ...registrationCbe,
          fullName: 'error',
        };

        await seedIncludedRegistrations(
          [registrationCbeWithError],
          programId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 3001,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        });

        // Assert
        const getTransactionsBody = await getTransactions({
          programId,
          paymentNr: payment,
          referenceId: registrationCbeWithError.referenceId,
          accessToken,
        });

        expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
        expect(doPaymentResponse.body.applicableCount).toBe(
          paymentReferenceIds.length,
        );
        expect(getTransactionsBody.body[0].status).toBe(
          TransactionStatusEnum.error,
        );
        expect(getTransactionsBody.body[0].errorMessage).toBe('Other failure'); // ##TODO: Change to match snapshot.
      });
    });

    describe('when credit transfer API call times out', () => {
      it('should succesfully do a payment with transactions that have status error', async () => {
        // Arrange
        const paymentReferenceIds = [registrationCbe.referenceId];

        // The fullName value triggers a specific mock scenario
        const registrationCbeWithTimeout = {
          ...registrationCbe,
          fullName: 'time-out',
        };

        await seedIncludedRegistrations(
          [registrationCbeWithTimeout],
          programId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 3001,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        });

        // Assert
        const getTransactionsBody = await getTransactions({
          programId,
          paymentNr: payment,
          referenceId: registrationCbeWithTimeout.referenceId,
          accessToken,
        });

        expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
        expect(doPaymentResponse.body.applicableCount).toBe(
          paymentReferenceIds.length,
        );
        expect(getTransactionsBody.body[0].status).toBe(
          TransactionStatusEnum.error,
        );
        expect(getTransactionsBody.body[0].errorMessage).toBe(
          // ##TODO: Change to match snapshot.
          'Failed because of an unknown error. Please contact 121 technical support.',
        );
      });
    });

    // ## TODO: Add 3 more test cases for duplicate transaction response from CBE: (1) no response, (2) failure, (3) success => See Activity Diagram: https://github.com/global-121/121-platform/wiki/Use-cases#use-case-do-a-payment-commercial-bank-of-ethiopia

    // ## TODO: Consider adding Asserts for stuff stored in customData, although when refactoring we do not want to use this anymore => See Activity Diagram: https://github.com/global-121/121-platform/wiki/Use-cases#use-case-do-a-payment-commercial-bank-of-ethiopia
  });
});
