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
      minimumNumberOfMessagesPerReferenceId: 2,
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
    expect(messageHistoryPa1.length).toBe(2);
    expect(messageHistoryPa1[0].attributes.status).toBeDefined();
    expect(messageHistoryPa2.length).toBe(0);
    expect(messageHistoryPa1[0].attributes.body).toEqual(message);
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
      minimumNumberOfMessagesPerReferenceId: 2,
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
    // RegistrationsOCW1
    expect(messageHistory1.length).toBe(0);
    expect(messageHistory2.length).toBe(0);
    expect(messageHistory3.length).toBe(2);
    expect(messageHistory4.length).toBe(2);
    expect(messageHistory3[0].attributes.body).toEqual(message);
    expect(messageHistory4[0].attributes.body).toEqual(message);
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
      minimumNumberOfMessagesPerReferenceId: 1,
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

    expect(messageHistory1.length).toBe(1);
    expect(messageHistory1[0].attributes.status).toBe('failed');
    expect(messageHistory1[0].attributes.errorCode).toEqual(
      TwilioErrorCodes.toNumberDoesNotExist,
    );

    expect(messageHistory2.length).toBe(1);
    expect(messageHistory2[0].attributes.status).toBe('failed');
    expect(messageHistory2[0].attributes.errorCode).toEqual(
      TwilioErrorCodes.toNumberDoesNotExist,
    );
  });
});
