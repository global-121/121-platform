import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.model';
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
import { programId, registration1, registration2 } from './pagination-data';

describe('send arbitrary messages to set of registrations', () => {
  let accessToken: string;
  const registrations = [registration1, registration2];

  const referenceIds = registrations.map(
    (registration) => registration.referenceId,
  );

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      programId,
      ProgramPhase.registrationValidation,
      accessToken,
    );
    await importRegistrations(programId, registrations, accessToken);
  });

  it('should send messages to selected PAs only', async () => {
    // Arrange
    const message = 'Long enough test message';

    // Act
    const sendMessageResponse = await sendMessage(
      programId,
      [referenceIds[0]],
      message,
      accessToken,
    );

    await waitForMessagesToComplete(
      programId,
      [referenceIds[0]],
      accessToken,
      8000,
    );

    const messageHistories = [];
    for (const referenceId of referenceIds) {
      const response = await getMessageHistory(
        programId,
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
