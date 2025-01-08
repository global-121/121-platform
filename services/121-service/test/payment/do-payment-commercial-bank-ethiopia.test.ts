import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationCbe } from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment to 1 PA', () => {
  const programId = 1;
  const payment = 1;
  const amount = 12;

  describe('with FSP: Commercial Bank Ethiopia', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.ethJointResponse);
      accessToken = await getAccessToken();
    });

    it('should successfully pay-out', async () => {
      // Arrange
      await importRegistrations(programId, [registrationCbe], accessToken);

      await awaitChangePaStatus(
        programId,
        [registrationCbe.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationCbe.referenceId];

      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitForPaymentTransactionsToComplete(
        programId,
        paymentReferenceIds,
        accessToken,
        3001,
        [TransactionStatusEnum.success, TransactionStatusEnum.error],
      );

      // Assert
      const getTransactionsBody = await getTransactions(
        programId,
        payment,
        registrationCbe.referenceId,
        accessToken,
      );

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
});
