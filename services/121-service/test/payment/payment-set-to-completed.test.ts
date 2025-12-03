import { TwilioStatus } from '@121-service/src/notifications/dto/twilio.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { messageTemplateGeneric } from '@121-service/src/seed-data/message-template/message-template-generic.const';
import { waitForMessagesToComplete } from '@121-service/test/helpers/program.helper';
import {
  getMessageHistory,
  getRegistrationEvents,
  seedPaidRegistrations,
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
    await resetDB(SeedScript.nlrcMultiple, __filename);
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
    ).body.filter(
      (event) => event.attributes.newValue === RegistrationStatusEnum.completed,
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
});
