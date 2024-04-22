import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.enum';
import {
  changePhase,
  waitForMessagesToComplete,
} from '../../helpers/program.helper';
import {
  getMessageHistory,
  importRegistrations,
  sendMessage,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from './pagination-data';

describe('send arbitrary messages to set of registrations', () => {
  let accessToken: string;
  const registrations = [
    registrationOCW1,
    registrationOCW2,
    registrationOCW3,
    registrationOCW4,
  ];

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      programIdOCW,
      ProgramPhase.registrationValidation,
      accessToken,
    );
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

    await waitForMessagesToComplete(
      programIdOCW,
      [referenceIds[0]],
      accessToken,
      10_000,
      2,
    );

    const messageHistories = [];
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
    expect(messageHistoryPa1[0].status).toBeDefined();
    expect(messageHistoryPa2.length).toBe(0);
    expect(messageHistoryPa1[0].body).toEqual(message);
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
      null,
      {
        'filter.addressPostalCode': `$ilike:5`, // selects registrationOCW2 and registrationOCW3 and registrationOCW4
        search: `str`, // select addressStreet of registrationOCW1, registrationOCW3, registrationOCW4
      }, // This combination should only apply to  registrationOCW3, registrationOCW4
    );

    await waitForMessagesToComplete(
      programIdOCW,
      [registrationOCW3.referenceId, registrationOCW4.referenceId],
      accessToken,
      10_000,
      2,
    );

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
    expect(messageHistory3[0].body).toEqual(message);
    expect(messageHistory4[0].body).toEqual(message);
  });
});
