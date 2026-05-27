import { TwilioStatus } from '@121-service/src/notifications/dto/twilio.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { messageTemplateGeneric } from '@121-service/src/seed-data/message-template/message-template-generic.const';
import {
  approvePayment,
  createPayment,
  startPayment,
  waitForMessagesToComplete,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  getMessageHistory,
  getRegistrationEvents,
  seedIncludedRegistrations,
  seedPaidRegistrations,
  waitForRegistrationToHaveUpdatedPaymentCount,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Set registration to completed after payment', () => {
  let accessToken: string;
  const programId = programIdPV;
  const transferValue = 25;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should set registration to complete on payment start when maxPayments is reached', async () => {
    // Arrange & Act
    const registration = { ...registrationPV5, maxPayments: 1 };
    await seedPaidRegistrations({
      registrations: [registration],
      programId,
      transferValue,
      completeStatuses: [TransactionStatusEnum.success],
    });
    const paymentReferenceIds = [registration.referenceId];

    // Assert - status change
    const statusChangeToCompleted = (
      await getRegistrationEvents({
        programId,
        accessToken,
        referenceId: registration.referenceId,
      })
    ).body.data.filter(
      (event) => event.newValue === RegistrationStatusEnum.completed,
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
      registration.referenceId,
      accessToken,
    );

    const messageHistory = messageHistoryResponse.body;
    const completedMessages = messageHistory.filter((message) =>
      expectedMessageTranslations.includes(message.attributes.body),
    );
    expect(completedMessages.length).toBe(1);
    const completedMessage = completedMessages[0];
    expect(completedMessage.attributes.status).not.toBe(TwilioStatus.failed);
    expect(completedMessage.attributes.contentType).toBe(
      MessageContentType.completed,
    );

    const initialVoucherMessage = messageHistory.find(
      (message) =>
        message.attributes.contentType === MessageContentType.paymentTemplated,
    );
    expect(new Date(initialVoucherMessage!.created).getTime()).toBeLessThan(
      new Date(completedMessage.created).getTime(),
    );
  });

  it('should only count started transactions toward paymentCount and marking as completed', async () => {
    // Arrange
    const registration = { ...registrationPV5, maxPayments: 1 };
    await seedIncludedRegistrations([registration], programId, accessToken);
    const referenceIds = [registration.referenceId];

    // Create two payments for the same registration (both get transactions in approved status)
    const createFirstPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds,
      accessToken,
      name: 'First Payment',
    });
    const firstPaymentId = createFirstPaymentResponse.body.id;
    await approvePayment({
      programId,
      paymentId: firstPaymentId,
      accessToken,
    });

    const createSecondPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds,
      accessToken,
      name: 'Second Payment',
    });
    const secondPaymentId = createSecondPaymentResponse.body.id;
    await approvePayment({
      programId,
      paymentId: secondPaymentId,
      accessToken,
    });

    // Act - start only the first payment
    await startPayment({
      programId,
      paymentId: firstPaymentId,
      accessToken,
    });

    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: referenceIds,
      accessToken,
      maxWaitTimeMs: 20_000,
    });

    // Assert - paymentCount should be 1 because only the started/completed
    // transaction counts; the second payment's transaction is still in
    // is excluded from the count.
    const registrationAfterFirstPayment =
      await waitForRegistrationToHaveUpdatedPaymentCount({
        programId,
        referenceId: registration.referenceId,
        expectedPaymentCount: 1,
        accessToken,
      });

    expect(registrationAfterFirstPayment!.paymentCount).toBe(1);
    expect(registrationAfterFirstPayment!.status).toBe(
      RegistrationStatusEnum.completed,
    );
  });
});
