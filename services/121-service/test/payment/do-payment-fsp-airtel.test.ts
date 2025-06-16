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
const payment = 1;
const amount = 200;

describe('Do payment', () => {
  describe('with FSP: Airtel', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.airtelProgram);
      accessToken = await getAccessToken();
    });

    describe('when create order API call gives a valid response', () => {
      it('should successfully do a payment', async () => {
        // Arrange
        const paymentReferenceIds = [registrationAirtel.referenceId];
        await seedIncludedRegistrations(
          [registrationAirtel],
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
          maxWaitTimeMs: 30_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });
        const getTransactionsResult = await getTransactions({
          programId,
          paymentNr: payment,
          registrationReferenceId: registrationAirtel.referenceId,
          accessToken,
        });
        const transaction = getTransactionsResult.body[0];

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
          registrationAirtel.paymentAmountMultiplier,
        );
        expect(transaction.errorMessage).toBe(null);
        expect(transaction.status).toBe(TransactionStatusEnum.success);
      });

      it('should correctly handle duplicate Airtel transactionId', async () => {
        // Arrange
        const registrationAirtelDuplicateTransactionId = {
          ...registrationAirtel,
          phoneNumber: '260000000001',
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
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
          paymentReferenceIds,
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
          paymentNr: payment,
          registrationReferenceId:
            registrationAirtelDuplicateTransactionId.referenceId,
          accessToken,
        });
        const transaction = getTransactionsResult.body[0];

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
          registrationAirtelDuplicateTransactionId.paymentAmountMultiplier,
        );
        expect(transaction.errorMessage).toBe(null);
        expect(transaction.status).toBe(TransactionStatusEnum.success);
      });
    });
  });
});
