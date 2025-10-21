import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { TwilioStatus } from '@121-service/src/notifications/dto/twilio.dto';
import { TwilioErrorCodes } from '@121-service/src/notifications/enum/twilio-error-codes.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitForMessagesToComplete } from '@121-service/test/helpers/program.helper';
import {
  getMessageHistory,
  importRegistrations,
  sendMessage,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('send arbitrary messages to set of registrations', () => {
  let accessToken: string;
  const registrations = [
    registrationOCW1,
    registrationOCW2,
    registrationOCW3,
    registrationOCW4,
  ];

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await importRegistrations(programIdOCW, registrations, accessToken);
  });

  it('should send messages to selected PAs only', async () => {
    // Arrange
    const message = 'Long enough test message';

    const referenceIds = registrations.map(
      (registration) => registration.referenceId,
    );

    // Act
    const sendMessageResponse = await sendMessage(
      accessToken,
      programIdOCW,
      [referenceIds[0]],
      message,
    );

    const expectedMessageAttribute: {
      key: 'body';
      values: (string | number | null | undefined)[];
    } = {
      key: 'body',
      values: [message],
    };
    await waitForMessagesToComplete({
      programId: programIdOCW,
      referenceIds: [referenceIds[0]],
      accessToken,
      expectedMessageAttribute,
    });

    const messageHistories: MessageActivity[][] = [];
    for (const referenceId of referenceIds) {
      const response = await getMessageHistory(
        programIdOCW,
        referenceId,
        accessToken,
      );
      const messages = response.body;
      messageHistories.push(messages);
    }
    const messageHistoryPa1 = messageHistories[0];
    const messageHistoryPa2 = messageHistories[1];

    // Assert
    expect(sendMessageResponse.body.totalFilterCount).toBe(1);
    expect(sendMessageResponse.body.applicableCount).toBe(1);
    // Only registrationOCW1 should receive the message
    const expectedMessagePa1 = messageHistoryPa1.filter((message: any) =>
      expectedMessageAttribute.values.includes(message.attributes.body),
    );
    expect(expectedMessagePa1.length).toBe(1);
    expect(expectedMessagePa1[0].attributes.status).not.toBe(
      TwilioStatus.failed,
    );
    // registrationOCW2 should not receive the message
    const expectedMessagePa2 = messageHistoryPa2.filter((message: any) =>
      expectedMessageAttribute.values.includes(message.attributes.body),
    );
    expect(expectedMessagePa2.length).toBe(0);
  });

  it('should send messages to PAs selected with a combination of filters', async () => {
    // Arrange
    const message = 'Long enough test message';

    // Act
    const sendMessageResponse = await sendMessage(
      accessToken,
      programIdOCW,
      [],
      message,
      undefined,
      {
        'filter.addressPostalCode': `$ilike:5`, // selects registrationOCW2 and registrationOCW3 and registrationOCW4
        search: `str`, // select addressStreet of registrationOCW1, registrationOCW3, registrationOCW4
      }, // This combination should only apply to  registrationOCW3, registrationOCW4
    );

    const expectedMessageAttribute: {
      key: 'body';
      values: (string | number | null | undefined)[];
    } = {
      key: 'body',
      values: [message],
    };
    await waitForMessagesToComplete({
      programId: programIdOCW,
      referenceIds: [
        registrationOCW3.referenceId,
        registrationOCW4.referenceId,
      ],
      accessToken,
      expectedMessageAttribute,
    });

    const messageHistory1 = (
      await getMessageHistory(
        programIdOCW,
        registrationOCW1.referenceId,
        accessToken,
      )
    ).body;
    const messageHistory2 = (
      await getMessageHistory(
        programIdOCW,
        registrationOCW2.referenceId,
        accessToken,
      )
    ).body;
    const messageHistory3 = (
      await getMessageHistory(
        programIdOCW,
        registrationOCW3.referenceId,
        accessToken,
      )
    ).body;
    const messageHistory4 = (
      await getMessageHistory(
        programIdOCW,
        registrationOCW4.referenceId,
        accessToken,
      )
    ).body;

    // Assert
    expect(sendMessageResponse.body.totalFilterCount).toBe(2);
    expect(sendMessageResponse.body.applicableCount).toBe(2);
    // Only registrationOCW3 and registrationOCW4 should receive the message
    const expectedMessagesPa1 = messageHistory1.filter((message: any) =>
      expectedMessageAttribute.values.includes(message.attributes.body),
    );
    const expectedMessagesPa2 = messageHistory2.filter((message: any) =>
      expectedMessageAttribute.values.includes(message.attributes.body),
    );
    const expectedMessagesPa3 = messageHistory3.filter((message: any) =>
      expectedMessageAttribute.values.includes(message.attributes.body),
    );
    const expectedMessagesPa4 = messageHistory4.filter((message: any) =>
      expectedMessageAttribute.values.includes(message.attributes.body),
    );
    expect(expectedMessagesPa1.length).toBe(0);
    expect(expectedMessagesPa2.length).toBe(0);
    expect(expectedMessagesPa3.length).toBe(1);
    expect(expectedMessagesPa4.length).toBe(1);
    expect(expectedMessagesPa3[0].attributes.status).not.toBe(
      TwilioStatus.failed,
    );
    expect(expectedMessagesPa4[0].attributes.status).not.toBe(
      TwilioStatus.failed,
    );
  });

  it('should show an error when sending message to a phone number that does not exist', async () => {
    // Arrange
    const toNumberDoesNotExist = '16005550006';
    const message = 'Long enough test message';
    const reason = 'test reason';

    // Test sms
    await updateRegistration(
      programIdOCW,
      registrationOCW1.referenceId,
      {
        phoneNumber: toNumberDoesNotExist,
        whatsappPhoneNumber: null,
      },
      reason,
      accessToken,
    );

    // Test whatsapp
    await updateRegistration(
      programIdOCW,
      registrationOCW2.referenceId,
      {
        whatsappPhoneNumber: toNumberDoesNotExist,
      },
      reason,
      accessToken,
    );

    // Act
    const sendMessageResponse = await sendMessage(
      accessToken,
      programIdOCW,
      [registrationOCW1.referenceId, registrationOCW2.referenceId],
      message,
    );

    await waitForMessagesToComplete({
      programId: programIdOCW,
      referenceIds: [
        registrationOCW1.referenceId,
        registrationOCW2.referenceId,
      ],
      accessToken,
      expectedMessageAttribute: {
        key: 'status',
        values: ['failed'],
      },
    });

    const messageHistory1 = (
      await getMessageHistory(
        programIdOCW,
        registrationOCW1.referenceId,
        accessToken,
      )
    ).body;

    const messageHistory2 = (
      await getMessageHistory(
        programIdOCW,
        registrationOCW2.referenceId,
        accessToken,
      )
    ).body;

    // Assert
    expect(sendMessageResponse.body.totalFilterCount).toBe(2);
    expect(sendMessageResponse.body.applicableCount).toBe(2);

    const expectedMessageResult1 = messageHistory1.filter(
      (msg) => msg.attributes.status === 'failed',
    );
    expect(expectedMessageResult1.length).toBe(1);
    expect(messageHistory1[0].attributes.errorCode).toEqual(
      TwilioErrorCodes.toNumberDoesNotExist,
    );

    const expectedMessageResult2 = messageHistory1.filter(
      (msg) => msg.attributes.status === 'failed',
    );
    expect(expectedMessageResult2.length).toBe(1);
    expect(messageHistory2[0].attributes.errorCode).toEqual(
      TwilioErrorCodes.toNumberDoesNotExist,
    );
  });

  it('should not send message twice to the same registrations on fast consecutive requests', async () => {
    // Arrange
    const message = 'Send this message multiple times';
    const finalMessage =
      'Send this message at the end to check if all are complete, so we know we need to stop waiting';

    // The choice for 5 is arbitrary, we just want to send it multiple times
    // Without the fix the bug was not always triggered with 2 sends to we picked a higher number for now
    const amountOfSends = 5;

    // Act: Send the same message in fast consecutive requests

    for (let i = 0; i < amountOfSends; i++) {
      await sendMessage(
        accessToken,
        programIdOCW,
        [registrationOCW1.referenceId],
        message,
      );
    }

    // Send a final message to know when to stop waiting
    await sendMessage(
      accessToken,
      programIdOCW,
      [registrationOCW1.referenceId],
      finalMessage,
    );

    // Wait for all messages to complete
    await waitForMessagesToComplete({
      programId: programIdOCW,
      referenceIds: [registrationOCW1.referenceId],
      accessToken,
      expectedMessageAttribute: {
        key: 'body',
        values: [finalMessage],
      },
    });

    // Assert
    const messageHistory = (
      await getMessageHistory(
        programIdOCW,
        registrationOCW1.referenceId,
        accessToken,
      )
    ).body;

    // Filter message history to only include messages with body equal to message
    const filteredMessageHistory = messageHistory.filter(
      (msg) => msg.attributes.body === message,
    );

    expect(filteredMessageHistory.length).toBe(amountOfSends);
  });
});
