import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { getTransactionsIntersolveVoucher } from '@121-service/test/helpers/intersolve-voucher.helper';
import {
  doPayment,
  waitForMessagesToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getMessageHistory,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment to 1 PA', () => {
  const programId = programIdPV;
  const payment = 1;
  const amount = 22;
  const registrationAh = {
    referenceId: '63e62864557597e0a-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
    whatsappPhoneNumber: '14155238886',
  };

  describe('with FSP: Intersolve Voucher WhatsApp', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();
    });

    it('should succesfully pay-out', async () => {
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
        paymentNr: payment,
        amount,
        referenceIds: paymentReferenceIds,
        accessToken,
      });

      const getTransactionsBody = await getTransactionsIntersolveVoucher(
        programId,
        payment,
        registrationAh.referenceId,
        accessToken,
      );

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
        registrationAh.paymentAmountMultiplier,
      );
      expect(getTransactionsBody[0].status).toBe(TransactionStatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);

      await waitForMessagesToComplete({
        programId,
        referenceIds: [registrationAh.referenceId],
        accessToken,
        minimumNumberOfMessagesPerReferenceId: 3,
      });

      const { body: messages } = await getMessageHistory(
        programId,
        registrationAh.referenceId,
        accessToken,
      );

      let imageCodeSecret;

      // Validate and remove dynamic fields before snapshot
      messages.forEach((message) => {
        // Validate the created date
        const createdDate = new Date(message.created);
        expect(createdDate.toString()).not.toBe('Invalid Date');

        // Remove the "created" and "from" fields from the messages
        // @ts-expect-error don't care about deleting non-optional properties
        delete message.created;

        if (message.attributes.mediaUrl?.includes('imageCode')) {
          const [mediaUrlPath, mediaUrlSecret] =
            message.attributes.mediaUrl.split('imageCode/');
          imageCodeSecret = mediaUrlSecret;
          // Override the actual mediaUrl with a fixed value to avoid snapshot mismatches
          message.attributes.mediaUrl = mediaUrlPath + 'imageCode/secret';
        }
      });

      // Assert the modified messages against the snapshot
      expect(messages).toMatchSnapshot();

      // Additional assertion for imageCodeSecret
      expect(imageCodeSecret).toHaveLength(200);
    });
  });
});
