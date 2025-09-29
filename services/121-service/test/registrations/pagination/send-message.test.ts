import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
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

    await waitForMessagesToComplete({
      programId: programIdOCW,
      referenceIds: [referenceIds[0]],
      accessToken,
      expectedMessageAttribute: {
        key: 'body',
        values: [message],
      },
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
    const messageSentToPa1 = messageHistoryPa1.some(
      (msg) => msg.attributes.body === message && msg.attributes.status,
    );
    expect(messageSentToPa1).toBe(true);
    const messageSentToPa2 = messageHistoryPa2.some(
      (msg) => msg.attributes.body === message,
    );
    expect(messageSentToPa2).toBe(false);
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

    await waitForMessagesToComplete({
      programId: programIdOCW,
      referenceIds: [
        registrationOCW3.referenceId,
        registrationOCW4.referenceId,
      ],
      accessToken,
      expectedMessageAttribute: {
        key: 'body',
        values: [message],
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
    expect(messageHistory1.some((msg) => msg.attributes.body === message)).toBe(
      false,
    );
    expect(messageHistory2.some((msg) => msg.attributes.body === message)).toBe(
      false,
    );
    expect(messageHistory3.some((msg) => msg.attributes.body === message)).toBe(
      true,
    );
    expect(messageHistory4.some((msg) => msg.attributes.body === message)).toBe(
      true,
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

    // first get the message to be expected from history by text (body)
    expect(
      messageHistory1.some((msg) => msg.attributes.status === 'failed'),
    ).toBe(true);
    // make waitForMessagesToComplete check for more types of attributes
    expect(messageHistory1[0].attributes.errorCode).toEqual(
      TwilioErrorCodes.toNumberDoesNotExist,
    );

    expect(
      messageHistory2.some((msg) => msg.attributes.status === 'failed'),
    ).toBe(true);
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
