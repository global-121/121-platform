import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { UILanguageEnum } from '@121-service/src/shared/enum/ui-language.enum';
import { getTransactionsIntersolveVoucher } from '@121-service/test/helpers/fsp-specific.helper';
import {
  createAndStartPayment,
  getTransactions,
  waitForMessagesToComplete,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  doPaymentAndWaitForCompletion,
  getMessageHistory,
  getTransactionEventDescriptions,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment to 1 PA', () => {
  const programId = programIdPV;
  const transferValue = 22;
  const registrationAh = {
    referenceId: '63e62864557597e0a-AH',
    preferredLanguage: UILanguageEnum.en,
    paymentAmountMultiplier: 1,
    fullName: 'John Smith',
    phoneNumber: '14155238886',
    programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
    whatsappPhoneNumber: '14155238886',
  };
  const paymentReferenceIds = [registrationAh.referenceId];
  let accessToken: string;
  let registrationAhCopy;

  describe('with FSP: Intersolve Voucher WhatsApp', () => {
    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple, __filename);
      accessToken = await getAccessToken();
      registrationAhCopy = { ...registrationAh };
    });

    it('should successfully pay-out', async () => {
      // Arrange
      await seedIncludedRegistrations(
        [registrationAhCopy],
        programId,
        accessToken,
      );

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
        maxWaitTimeMs: 20_000,
        paymentId,
      });

      const getTransactionsBody = await getTransactionsIntersolveVoucher({
        programId,
        paymentId,
        referenceId: registrationAhCopy.referenceId,
        accessToken,
      });

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
        registrationAhCopy.paymentAmountMultiplier,
      );
      expect(getTransactionsBody[0].status).toBe(TransactionStatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);

      await waitForMessagesToComplete({
        programId,
        referenceIds: [registrationAhCopy.referenceId],
        accessToken,
        expectedMessageAttribute: {
          key: 'contentType',
          values: [MessageContentType.paymentInstructions],
        },
      });

      const transactionEventDescriptions =
        await getTransactionEventDescriptions({
          programId,
          transactionId: getTransactionsBody[0].id,
          accessToken,
        });
      expect(transactionEventDescriptions).toEqual([
        TransactionEventDescription.created,
        TransactionEventDescription.approval,
        TransactionEventDescription.initiated,
        TransactionEventDescription.intersolveVoucherCreationRequest,
        TransactionEventDescription.intersolveVoucherInitialMessageSent,
        TransactionEventDescription.intersolveVoucherVoucherMessageSent,
        TransactionEventDescription.intersolveVoucherMessageCallback,
      ]);

      const { body: messages } = await getMessageHistory(
        programId,
        registrationAhCopy.referenceId,
        accessToken,
      );

      const ahVoucherRelatedMesssages = messages.filter((msg) =>
        [
          MessageContentType.paymentTemplated,
          MessageContentType.paymentVoucher,
          MessageContentType.paymentInstructions,
        ].includes(msg.attributes.contentType),
      );
      expect(ahVoucherRelatedMesssages.length).toBe(3);

      let imageCodeSecret;

      // Validate and remove dynamic fields before snapshot
      ahVoucherRelatedMesssages.forEach((message) => {
        // Validate the created date
        const createdDate = new Date(message.created);
        expect(createdDate.toString()).not.toBe('Invalid Date');

        // Remove the "created" field from the messages
        // @ts-expect-error don't care about deleting non-optional properties
        delete message.created;
        // @ts-expect-error don't care about deleting non-optional properties
        delete message.id;

        if (message.attributes.mediaUrl?.includes('imageCode')) {
          const [mediaUrlPath, mediaUrlSecret] =
            message.attributes.mediaUrl.split('imageCode/');
          imageCodeSecret = mediaUrlSecret;
          // Override the actual mediaUrl with a fixed value to avoid snapshot mismatches
          message.attributes.mediaUrl = mediaUrlPath + 'imageCode/secret';
        }

        // Strip any prefix before '/api/' to make snapshot environment agnostic
        if (message.attributes.mediaUrl) {
          const apiIndex = message.attributes.mediaUrl.indexOf('/api/');
          if (apiIndex > -1) {
            message.attributes.mediaUrl =
              message.attributes.mediaUrl.substring(apiIndex);
          }
        }
      });

      // Assert that both initial and voucher message are tied to a transaction
      const initialMessage = ahVoucherRelatedMesssages.find(
        (msg) =>
          msg.attributes.contentType === MessageContentType.paymentTemplated,
      );
      expect(initialMessage?.attributes.transactionId).not.toBeNull();
      const voucherMessage = messages.find(
        (msg) =>
          msg.attributes.contentType === MessageContentType.paymentVoucher,
      );
      expect(voucherMessage?.attributes.transactionId).not.toBeNull();

      // Assert the modified messages against the snapshot
      expect(ahVoucherRelatedMesssages).toMatchSnapshot();

      // Additional assertion for imageCodeSecret
      expect(imageCodeSecret).toHaveLength(200);
    });

    it('should fail pay-out due to invalid phone number', async () => {
      // Arrange
      const invalidPhoneNumber = '15005550001';
      registrationAhCopy.whatsappPhoneNumber = invalidPhoneNumber;

      await seedIncludedRegistrations(
        [registrationAhCopy],
        programId,
        accessToken,
      );

      // Act
      const paymentId = await doPaymentAndWaitForCompletion({
        programId,
        transferValue,
        referenceIds: paymentReferenceIds,
        accessToken,
        completeStatuses: [
          TransactionStatusEnum.success,
          TransactionStatusEnum.error,
        ],
      });

      await waitForMessagesToComplete({
        programId,
        referenceIds: [registrationAhCopy.referenceId],
        accessToken,
        minimumNumberOfMessagesPerReferenceId: 1,
      });

      const getTransactionsBody = await getTransactions({
        programId,
        paymentId,
        registrationReferenceId: registrationAhCopy.referenceId,
        accessToken,
      });

      // Assert
      expect(getTransactionsBody.body[0].status).toBe(
        TransactionStatusEnum.error,
      );

      expect(getTransactionsBody.body[0].errorMessage).toMatchSnapshot();
    });

    it('payout should stay on waiting if no incoming message comes in', async () => {
      // Arrange
      const noIncomingMessagePhoneNumber = '16005550002';
      registrationAhCopy.whatsappPhoneNumber = noIncomingMessagePhoneNumber;

      await seedIncludedRegistrations(
        [registrationAhCopy],
        programId,
        accessToken,
      );

      // Act
      const paymentId = await doPaymentAndWaitForCompletion({
        programId,
        transferValue,
        referenceIds: paymentReferenceIds,
        accessToken,
        completeStatuses: [
          TransactionStatusEnum.success,
          TransactionStatusEnum.error,
          TransactionStatusEnum.waiting,
        ],
      });

      await waitForMessagesToComplete({
        programId,
        referenceIds: [registrationAhCopy.referenceId],
        accessToken,
        minimumNumberOfMessagesPerReferenceId: 1,
      });

      const getTransactionsBody = await getTransactions({
        programId,
        paymentId,
        registrationReferenceId: registrationAhCopy.referenceId,
        accessToken,
      });

      // Assert
      expect(getTransactionsBody.body[0].status).toBe(
        TransactionStatusEnum.waiting,
      );
      expect(getTransactionsBody.body[0].errorMessage).toBeNull();
    });

    it('should successfully pay-out for Intersolve Voucher paper', async () => {
      // Arrange
      registrationAhCopy.programFspConfigurationName =
        Fsps.intersolveVoucherPaper;
      registrationAhCopy.whatsappPhoneNumber = null;
      await seedIncludedRegistrations(
        [registrationAhCopy],
        programId,
        accessToken,
      );

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
        maxWaitTimeMs: 20_000,
        paymentId,
      });

      const getTransactionsBody = await getTransactionsIntersolveVoucher({
        programId,
        paymentId,
        referenceId: registrationAhCopy.referenceId,
        accessToken,
      });

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
        registrationAhCopy.paymentAmountMultiplier,
      );
      expect(getTransactionsBody[0].status).toBe(TransactionStatusEnum.success);
      expect(getTransactionsBody[0].errorMessage).toBe(null);
    });
  });
});
