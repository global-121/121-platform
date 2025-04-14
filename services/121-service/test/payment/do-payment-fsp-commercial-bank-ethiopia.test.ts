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

    // ## TODO: Add test when there is an error response from CBE API

    // ## TODO: Add test when there is a time-out on CBE API

    // ## TODO: Brainstorm and decide if we want to add more test cases, see Nedbank for examples.
  });
});
