import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  createAndStartPayment,
  getTransactionsByPaymentIdPaginated,
  patchProgram,
  retryPayment,
  waitForPaymentTransactionsToComplete,
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

describe('Do payment to 1 PA', () => {
  const programId = 1;
  const transferValue = 12327;
  const registrationSafaricom = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    programFspConfigurationName: Fsps.safaricom,
    phoneNumber: '254708374149',
    preferredLanguage: RegistrationPreferredLanguage.en,
    paymentAmountMultiplier: 1,
    maxPayments: 6,
    fullName: 'Barbara Floyd',
    gender: 'male',
    age: 25,
    nationalId: '32121321',
  };

  describe('with FSP: Safaricom', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.safaricomProgram, __filename);
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
      await seedIncludedRegistrations(
        [registrationSafaricom],
        programId,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

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
        registrationReferenceId: registrationSafaricom.referenceId,
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

      const transactionEventDescriptions =
        await getTransactionEventDescriptions({
          programId,
          transactionId: getTransactionsBody.body.data[0].id,
          accessToken,
        });
      expect(transactionEventDescriptions).toEqual([
        TransactionEventDescription.created,
        TransactionEventDescription.approval,
        TransactionEventDescription.initiated,
        TransactionEventDescription.safaricomRequestSent,
        TransactionEventDescription.safaricomCallbackReceived,
      ]);
    });

    it('should yield error transaction when the initial safaricom api call gives error', async () => {
      // Arrange
      registrationSafaricom.phoneNumber = '254000000000';
      await seedIncludedRegistrations(
        [registrationSafaricom],
        programId,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

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
        accessToken,
        maxWaitTimeMs: 4_000,
        completeStatuses: [
          TransactionStatusEnum.error,
          TransactionStatusEnum.success,
          TransactionStatusEnum.waiting,
        ],
      });

      // Assert
      const getTransactionsBody = await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        registrationReferenceId: registrationSafaricom.referenceId,
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
    });

    it('should successfully retry pay-out after an initial failure', async () => {
      // Arrange
      registrationSafaricom.phoneNumber = '254000000000';
      await seedIncludedRegistrations(
        [registrationSafaricom],
        programId,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

      // Act
      // Initial failing payment
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
        accessToken,
        maxWaitTimeMs: 4_000,
        completeStatuses: [
          TransactionStatusEnum.error,
          TransactionStatusEnum.success,
          TransactionStatusEnum.waiting,
        ],
      });

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
      await retryPayment({
        programId,
        paymentId,
        accessToken,
      });
      await waitFor(2_000);

      // Assert
      const getTransactionsBody = await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        registrationReferenceId: registrationSafaricom.referenceId,
        accessToken,
      });

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody.body.data[0].status).toBe(
        TransactionStatusEnum.success,
      );

      const transactionEventDescriptions =
        await getTransactionEventDescriptions({
          programId,
          transactionId: getTransactionsBody.body.data[0].id,
          accessToken,
        });
      expect(transactionEventDescriptions).toEqual([
        TransactionEventDescription.created,
        TransactionEventDescription.approval,
        TransactionEventDescription.initiated,
        TransactionEventDescription.safaricomRequestSent,
        TransactionEventDescription.retry,
        TransactionEventDescription.safaricomRequestSent,
        TransactionEventDescription.safaricomCallbackReceived,
      ]);
    });

    it('should fail to pay-out to PA due to time out in communication from Safaricom to PA', async () => {
      // Arrange
      const magicPhoneNrTimeout = '254000000002';
      registrationSafaricom.phoneNumber = magicPhoneNrTimeout;
      await seedIncludedRegistrations(
        [registrationSafaricom],
        programId,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

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
        registrationReferenceId: registrationSafaricom.referenceId,
        accessToken,
      });

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody.body.data[0].status).toBe(
        TransactionStatusEnum.error,
      );
      expect(getTransactionsBody.body.data[0].errorMessage).toBe(
        'Transfer timed out',
      );
    });

    it('should correctly label transaction as "success" even if callback is earlier than request', async () => {
      // Arrange
      const magicPhoneNrTooEarly = '254000000003';
      registrationSafaricom.phoneNumber = magicPhoneNrTooEarly;
      await seedIncludedRegistrations(
        [registrationSafaricom],
        programId,
        accessToken,
      );
      const paymentReferenceIds = [registrationSafaricom.referenceId];

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
        registrationReferenceId: registrationSafaricom.referenceId,
        accessToken,
      });

      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody.body.data[0].status).toBe(
        TransactionStatusEnum.success,
      );
    });
  });
});
