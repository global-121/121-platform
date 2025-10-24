import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TwilioStatus } from '@121-service/src/notifications/dto/twilio.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { messageTemplateGeneric } from '@121-service/src/seed-data/message-template/message-template-generic.const';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import {
  createPayment,
  getTransactions,
  startPayment,
  waitForMessagesToComplete,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getMessageHistory,
  getRegistrationEvents,
  getRegistrations,
  importRegistrations,
  waitForRegistrationToHaveUpdatedPaymentCount,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

// ##TODO better describe and file name with extended scope of this test now
describe('Do a payment to a PA with maxPayments=1', () => {
  const programId = programIdPV;
  const transferValue = 25;
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

      // Act 1 - create payment
      const createPaymentResponse = await createPayment({
        programId,
        transferValue,
        referenceIds: paymentReferenceIds,
        accessToken,
      });
      const paymentId = createPaymentResponse.body.id;
      await waitForPaymentTransactionsToComplete({
        programId,
        paymentReferenceIds,
        accessToken,
        maxWaitTimeMs: 20_000,
        completeStatusses: [TransactionStatusEnum.created],
      });

      // Assert 1 - before starting payment
      const getTransactionsBeforeStartResponse = await getTransactions({
        programId,
        paymentId,
        registrationReferenceId: registrationAh.referenceId,
        accessToken,
      });
      const transactionsBeforeStart = getTransactionsBeforeStartResponse.body;

      const registrations = await getRegistrations({
        programId,
        accessToken,
        filter: {
          'filter.referenceId': registrationAh.referenceId,
        },
      });
      const registrationBeforeStart = registrations.body.data[0];

      expect(createPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(createPaymentResponse.body.applicableCount).toBe(
        paymentReferenceIds.length,
      );
      expect(transactionsBeforeStart[0].status).toBe(
        TransactionStatusEnum.created,
      );
      expect(registrationBeforeStart!.status).toBe(
        RegistrationStatusEnum.included,
      );
      expect(registrationBeforeStart!.paymentCount).toBe(0);

      // Act 2 - start payment
      const startPaymentResponse = await startPayment({
        programId,
        paymentId,
        accessToken,
      });
      await waitForPaymentTransactionsToComplete({
        programId,
        paymentReferenceIds,
        accessToken,
        maxWaitTimeMs: 20_000,
      });

      // Assert 2 - after payment
      const getTransactionsAfterStartResponse = await getTransactions({
        programId,
        paymentId,
        registrationReferenceId: registrationAh.referenceId,
        accessToken,
      });
      const transactionsAfterStart = getTransactionsAfterStartResponse.body;
      // Wait for registration to be updated
      const registrationAfterStart =
        await waitForRegistrationToHaveUpdatedPaymentCount({
          programId,
          referenceId: registrationAh.referenceId,
          expectedPaymentCount: 1,
          accessToken,
        });
      expect(startPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
      expect(transactionsAfterStart[0].status).toBe(
        TransactionStatusEnum.success,
      );
      expect(transactionsAfterStart[0].errorMessage).toBe(null);

      expect(registrationAfterStart!.status).toBe(
        RegistrationStatusEnum.completed,
      );
      expect(registrationAfterStart!.paymentCountRemaining).toBe(0);
      expect(registrationAfterStart!.paymentCount).toBe(1);

      const statusChangeToCompleted = (
        await getRegistrationEvents({
          programId,
          accessToken,
          referenceId: registrationAh.referenceId,
        })
      ).body.filter(
        (event) =>
          event.attributes.newValue === RegistrationStatusEnum.completed,
      );
      expect(statusChangeToCompleted.length).toBe(1);

      // Assert message sent
      const expectedMessageTranslations = Object.values(
        messageTemplateGeneric.completed.message ?? {},
      );

      await waitForMessagesToComplete({
        programId,
        referenceIds: paymentReferenceIds,
        accessToken,
        expectedMessageAttribute: {
          key: 'body',
          values: expectedMessageTranslations,
        },
      });

      const messageHistoryResponse = await getMessageHistory(
        programId,
        registrationAh.referenceId,
        accessToken,
      );

      const messageHistory = messageHistoryResponse.body;
      const expectedMessages = messageHistory.filter((message) =>
        expectedMessageTranslations.includes(message.attributes.body),
      );
      expect(expectedMessages.length).toBe(1);
      expect(expectedMessages[0].attributes.status).not.toBe(
        TwilioStatus.failed,
      );
      expect(expectedMessages[0].attributes.contentType).toBe(
        MessageContentType.completed,
      );
    });
  });
});
