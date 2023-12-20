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
} from './pagination-data';

describe('send arbitrary messages to set of registrations', () => {
  let accessToken: string;
  const registrations = [registrationOCW1, registrationOCW2];

  const referenceIds = registrations.map(
    (registration) => registration.referenceId,
  );

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

    // Act
    const sendMessageResponse = await sendMessage(
      programIdOCW,
      [referenceIds[0]],
      message,
      accessToken,
    );

    await waitForMessagesToComplete(
      programIdOCW,
      [referenceIds[0]],
      accessToken,
      8000,
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
    expect(messageHistoryPa1.length).toBe(1);
    expect(messageHistoryPa1[0].status).toBeDefined();
    expect(messageHistoryPa2.length).toBe(0);
  });
});
