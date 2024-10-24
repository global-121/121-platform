import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  patchProgram,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment to 1 PA', () => {
  const programId = 2;
  const payment = 1;
  const amount = 12327;

  describe('with FSP: Safaricom', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.krcsMultiple);
      accessToken = await getAccessToken();
    });

    it('should successfully pay-out', async () => {
      // Arrange
      const program = {
        allowEmptyPhoneNumber: false,
      };

      // Act
      // Call the update function
      await patchProgram(2, program as UpdateProgramDto, accessToken);

      // Arrange
      registrationSafaricom.phoneNumber = '254708374149';
      await importRegistrations(
        programId,
        [registrationSafaricom],
        accessToken,
      );

      await awaitChangePaStatus(
        programId,
        [registrationSafaricom.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

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
        registrationSafaricom.referenceId,
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

    it('should give error the initial safaricom api call', async () => {
      // Act
      // Call the update function

      // Arrange
      registrationSafaricom.phoneNumber = '254000000000';
      await importRegistrations(
        programId,
        [registrationSafaricom],
        accessToken,
      );
      await awaitChangePaStatus(
        programId,
        [registrationSafaricom.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

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
        Object.values(TransactionStatusEnum),
      );

      // Assert
      const getTransactionsBody = await getTransactions(
        programId,
        payment,
        registrationSafaricom.referenceId,
        accessToken,
      );

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody.body[0].status).toBe(
        TransactionStatusEnum.error,
      );
      expect(getTransactionsBody.body[0].errorMessage).toBe(
        '401.002.01 - Error Occurred - Invalid Access Token - mocked_access_token',
      );
    });

    it('should successfully retry pay-out after an initial failure', async () => {
      // Act
      // Call the update function

      // Arrange
      registrationSafaricom.phoneNumber = '254000000000';
      await importRegistrations(
        programId,
        [registrationSafaricom],
        accessToken,
      );
      await awaitChangePaStatus(
        programId,
        [registrationSafaricom.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

      // Act
      // Initial failing payment
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
        Object.values(TransactionStatusEnum),
      );

      // update PA
      await updateRegistration(
        programId,
        registrationSafaricom.referenceId,
        { phoneNumber: '254708374149' },
        'automated test',
        accessToken,
      );
      // await waitFor(2_000);

      // retry payment
      await retryPayment(programId, payment, accessToken);
      await waitFor(2_000);

      // Assert
      const getTransactionsBody = await getTransactions(
        programId,
        payment,
        registrationSafaricom.referenceId,
        accessToken,
      );

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody.body[0].status).toBe(
        TransactionStatusEnum.success,
      );
    });

    it('should fail to pay-out to PA due to time out in communication from Safaricom to PA', async () => {
      // Arrange
      const magigPhoneNrTimeout = '254000000002';
      registrationSafaricom.phoneNumber = magigPhoneNrTimeout;
      await importRegistrations(
        programId,
        [registrationSafaricom],
        accessToken,
      );

      await awaitChangePaStatus(
        programId,
        [registrationSafaricom.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

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
        registrationSafaricom.referenceId,
        accessToken,
      );

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody.body[0].status).toBe(
        TransactionStatusEnum.error,
      );
      expect(getTransactionsBody.body[0].errorMessage).toBe(
        'Transfer timed out',
      );
    });
  });
});
