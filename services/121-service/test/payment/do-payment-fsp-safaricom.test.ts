import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { UpdateProjectDto } from '@121-service/src/projects/dto/update-project.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  patchProject,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Do payment to 1 PA', () => {
  const projectId = 1;
  const amount = 12327;
  const registrationSafaricom = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    projectFspConfigurationName: Fsps.safaricom,
    phoneNumber: '254708374149',
    preferredLanguage: LanguageEnum.en,
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
      await resetDB(SeedScript.safaricomProject, __filename);
      accessToken = await getAccessToken();
    });

    it('should successfully pay-out', async () => {
      // Arrange
      const project = {
        allowEmptyPhoneNumber: false,
      };

      // Act
      // Call the update function
      await patchProject(2, project as UpdateProjectDto, accessToken);

      // Arrange
      registrationSafaricom.phoneNumber = '254708374149';
      await importRegistrations(
        projectId,
        [registrationSafaricom],
        accessToken,
      );

      await awaitChangeRegistrationStatus({
        projectId,
        referenceIds: [registrationSafaricom.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationSafaricom.referenceId];

      // Act
      const doPaymentResponse = await doPayment({
        projectId,
        amount,
        referenceIds: paymentReferenceIds,
        accessToken,
      });
      const paymentId = doPaymentResponse.body.id;

      await waitForPaymentTransactionsToComplete({
        projectId,
        paymentReferenceIds,
        accessToken,
        maxWaitTimeMs: 4_000,
        completeStatusses: [
          TransactionStatusEnum.success,
          TransactionStatusEnum.error,
        ],
      });

      // Assert
      const getTransactionsBody = await getTransactions({
        projectId,
        paymentId,
        registrationReferenceId: registrationSafaricom.referenceId,
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

    it('should give error the initial safaricom api call', async () => {
      // Act
      // Call the update function

      // Arrange
      registrationSafaricom.phoneNumber = '254000000000';
      await importRegistrations(
        projectId,
        [registrationSafaricom],
        accessToken,
      );
      await awaitChangeRegistrationStatus({
        projectId,
        referenceIds: [registrationSafaricom.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationSafaricom.referenceId];

      // Act
      const doPaymentResponse = await doPayment({
        projectId,
        amount,
        referenceIds: paymentReferenceIds,
        accessToken,
      });
      const paymentId = doPaymentResponse.body.id;

      await waitForPaymentTransactionsToComplete({
        projectId,
        paymentReferenceIds,
        accessToken,
        maxWaitTimeMs: 4_000,
        completeStatusses: Object.values(TransactionStatusEnum),
      });

      // Assert
      const getTransactionsBody = await getTransactions({
        projectId,
        paymentId,
        registrationReferenceId: registrationSafaricom.referenceId,
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
        '401.002.01 - Error Occurred - Invalid Access Token - mocked_access_token',
      );
    });

    it('should successfully retry pay-out after an initial failure', async () => {
      // Act
      // Call the update function

      // Arrange
      registrationSafaricom.phoneNumber = '254000000000';
      await importRegistrations(
        projectId,
        [registrationSafaricom],
        accessToken,
      );
      await awaitChangeRegistrationStatus({
        projectId,
        referenceIds: [registrationSafaricom.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationSafaricom.referenceId];

      // Act
      // Initial failing payment
      const doPaymentResponse = await doPayment({
        projectId,
        amount,
        referenceIds: paymentReferenceIds,
        accessToken,
      });
      const paymentId = doPaymentResponse.body.id;

      await waitForPaymentTransactionsToComplete({
        projectId,
        paymentReferenceIds,
        accessToken,
        maxWaitTimeMs: 4_000,
        completeStatusses: Object.values(TransactionStatusEnum),
      });

      // update PA
      await updateRegistration(
        projectId,
        registrationSafaricom.referenceId,
        { phoneNumber: '254708374149' },
        'automated test',
        accessToken,
      );
      // await waitFor(2_000);

      // retry payment
      await retryPayment({
        projectId,
        paymentId,
        accessToken,
      });
      await waitFor(2_000);

      // Assert
      const getTransactionsBody = await getTransactions({
        projectId,
        paymentId,
        registrationReferenceId: registrationSafaricom.referenceId,
        accessToken,
      });

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
        projectId,
        [registrationSafaricom],
        accessToken,
      );

      await awaitChangeRegistrationStatus({
        projectId,
        referenceIds: [registrationSafaricom.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationSafaricom.referenceId];

      // Act
      const doPaymentResponse = await doPayment({
        projectId,
        amount,
        referenceIds: paymentReferenceIds,
        accessToken,
      });
      const paymentId = doPaymentResponse.body.id;

      await waitForPaymentTransactionsToComplete({
        projectId,
        paymentReferenceIds,
        accessToken,
        maxWaitTimeMs: 4_000,
        completeStatusses: [
          TransactionStatusEnum.success,
          TransactionStatusEnum.error,
        ],
      });

      // Assert
      const getTransactionsBody = await getTransactions({
        projectId,
        paymentId,
        registrationReferenceId: registrationSafaricom.referenceId,
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
        'Transfer timed out',
      );
    });
  });
});
