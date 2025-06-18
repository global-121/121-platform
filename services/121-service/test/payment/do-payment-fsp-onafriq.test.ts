import { HttpStatus } from '@nestjs/common';

import { FinancialServiceProviders } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Do payment to 1 PA', () => {
  const programId = 1;
  const payment = 1;
  const amount = 12327;
  const registrationOnafriq = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    programFinancialServiceProviderConfigurationName:
      FinancialServiceProviders.onafriq,
    phoneNumber: '243708374149',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    maxPayments: 6,
    firstName: 'Barbara',
    lastName: 'Floyd',
    gender: 'male',
    age: 25,
  };

  describe('with FSP: Onafriq', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.onafriqProgram);
      accessToken = await getAccessToken();
    });

    it('should successfully pay-out', async () => {
      // Arrange
      registrationOnafriq.phoneNumber = '243708374149';
      await importRegistrations(programId, [registrationOnafriq], accessToken);

      await awaitChangeRegistrationStatus({
        programId,
        referenceIds: [registrationOnafriq.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationOnafriq.referenceId];

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
        maxWaitTimeMs: 4_000,
        completeStatusses: [
          TransactionStatusEnum.success,
          TransactionStatusEnum.error,
        ],
      });

      // Assert
      const getTransactionsBody = await getTransactions({
        programId,
        paymentNr: payment,
        registrationReferenceId: registrationOnafriq.referenceId,
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

    it('should give error on the initial request based on magic phonenumber', async () => {
      // Arrange
      registrationOnafriq.phoneNumber = '24300000000'; // this magic number is configured in mock to return an error on request
      await importRegistrations(programId, [registrationOnafriq], accessToken);
      await awaitChangeRegistrationStatus({
        programId,
        referenceIds: [registrationOnafriq.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationOnafriq.referenceId];

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
        maxWaitTimeMs: 4_000,
        completeStatusses: Object.values(TransactionStatusEnum),
      });

      // Assert
      const getTransactionsBody = await getTransactions({
        programId,
        paymentNr: payment,
        registrationReferenceId: registrationOnafriq.referenceId,
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
        'Error: 101 - Rejected - Generic mock error on request',
      );
    });

    it('should give error via callback based on magic phonenumber', async () => {
      // Arrange
      registrationOnafriq.phoneNumber = '24300000001'; // this magic number is configured in mock to return an error on callback
      await importRegistrations(programId, [registrationOnafriq], accessToken);
      await awaitChangeRegistrationStatus({
        programId,
        referenceIds: [registrationOnafriq.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationOnafriq.referenceId];

      // Act
      const doPaymentResponse = await doPayment({
        programId,
        paymentNr: payment,
        amount,
        referenceIds: paymentReferenceIds,
        accessToken,
      });

      // wait for non-waiting transactions only, to make sure callback came in
      await waitForPaymentTransactionsToComplete({
        programId,
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
        programId,
        paymentNr: payment,
        registrationReferenceId: registrationOnafriq.referenceId,
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
        'Error: ER103 - Mock error on callback',
      );
    });
  });
});
