import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { messageTemplateGeneric } from '@121-service/src/seed-data/message-template/message-template-generic.const';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { waitForMessagesToComplete } from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getEvents,
  getMessageHistory,
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('Do a payment to a PA with maxPayments=1', () => {
  const programId = programIdPV;
  const amount = 25;
  const registrationAh = {
    referenceId: '63e62864557597e0b-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
    whatsappPhoneNumber: '14155238886',
    maxPayments: 1,
  };

  describe('with FSP: Intersolve Voucher WhatsApp', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple, __filename);
      accessToken = await getAccessToken();
    });

    it('should set registration to complete', async () => {
      // Arrange
      await importRegistrations(programId, [registrationAh], accessToken);
      await awaitChangeRegistrationStatus({
        programId,
        referenceIds: [registrationAh.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationAh.referenceId];

      // Act
      const doPaymentResponse = await doPayment({
        programId,
        amount,
        referenceIds: paymentReferenceIds,
        accessToken,
      });
      const paymentId = doPaymentResponse.body.id;

      // Assert
      await waitForPaymentTransactionsToComplete({
        programId,
        paymentReferenceIds: [registrationAh.referenceId],
        accessToken,
        maxWaitTimeMs: 10_000,
      });

      const getTransactionsRes = await getTransactions({
        programId,
        paymentId,
        registrationReferenceId: registrationAh.referenceId,
        accessToken,
      });
      const getTransactionsBody = getTransactionsRes.body;
      // Wait for registration to be updated
      const timeout = 80_000; // Timeout in milliseconds
      const interval = 1_000; // Interval between retries in milliseconds
      let elapsedTime = 0;
      let getRegistration: MappedPaginatedRegistrationDto | null = null;
      while (
        (!getRegistration || getRegistration.paymentCount !== 1) &&
        elapsedTime < timeout
      ) {
        const getRegistraitonRes = await getRegistrations({
          programId,
          accessToken,
        });
        getRegistration = getRegistraitonRes.body.data[0];

        await waitFor(interval);
        elapsedTime += interval;
      }
      // Assert
      expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(doPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(getTransactionsBody[0].status).toBe(TransactionStatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);

      expect(getRegistration!.status).toBe(RegistrationStatusEnum.completed);
      expect(getRegistration!.paymentCountRemaining).toBe(0);
      expect(getRegistration!.paymentCount).toBe(1);

      const statusChangeToCompleted = (
        await getEvents({
          programId,
          accessToken,
          referenceId: registrationAh.referenceId,
        })
      ).body.filter(
        (event) =>
          event.attributes.newValue === RegistrationStatusEnum.completed,
      );
      expect(statusChangeToCompleted.length).toBe(1);
    });

    it('should send a template message when status is complete', async () => {
      // Arrange
      await importRegistrations(programId, [registrationAh], accessToken);
      await awaitChangeRegistrationStatus({
        programId,
        referenceIds: [registrationAh.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });

      // Act
      await doPayment({
        programId,
        amount,
        referenceIds: [registrationAh.referenceId],
        accessToken,
      });

      await waitForPaymentTransactionsToComplete({
        programId,
        paymentReferenceIds: [registrationAh.referenceId],
        accessToken,
        maxWaitTimeMs: 10_000,
      });

      // This is a bit sketchy: if for example in the future more messages are sent in the registration phase, this test will fail.
      // Is there a better way to do this?
      await waitForMessagesToComplete({
        programId,
        referenceIds: [registrationAh.referenceId],
        accessToken,
        minimumNumberOfMessagesPerReferenceId: 6,
      });

      // Assert
      const messageHistoryResponse = await getMessageHistory(
        programId,
        registrationAh.referenceId,
        accessToken,
      );

      const messageHistory = messageHistoryResponse.body;
      const messageTranslations = Object.values(
        messageTemplateGeneric.completed.message ?? {},
      );
      const messageSent = messageHistory.some((message) =>
        messageTranslations.includes(message.attributes.body),
      );
      expect(messageSent).toBe(true);
    });
  });
});
