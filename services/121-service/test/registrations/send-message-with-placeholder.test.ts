import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { waitForMessagesToComplete } from '../helpers/program.helper';
import {
  getMessageHistory,
  importRegistrations,
  sendMessage,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { programIdPV } from './pagination/pagination-data';

describe('Send custom message with placeholders', () => {
  const programId = programIdPV;
  const registrationAh = {
    referenceId: '63e62864557597e0d-AH',
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    fspName: FspName.intersolveVoucherPaper, // use SMS PA, so that template directly arrives
    namePartnerOrganization: 'Test organization',
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationAh], accessToken);
  });

  it('should send message with placeholder values processed', async () => {
    // Arrange
    const message = 'This is a test message with {{namePartnerOrganization}}';

    // Act
    await sendMessage(
      programId,
      [registrationAh.referenceId],
      message,
      accessToken,
    );

    await waitForMessagesToComplete(
      programId,
      [registrationAh.referenceId],
      accessToken,
      8000,
    );

    const messageHistory = (
      await getMessageHistory(
        programId,
        registrationAh.referenceId,
        accessToken,
      )
    ).body;

    // Assert
    const processedMessage = message.replace(
      new RegExp('{{namePartnerOrganization}}', 'g'),
      registrationAh.namePartnerOrganization,
    ); //TODO: make this more flexible for other potential placeholders

    expect(messageHistory[0].body).toEqual(processedMessage);
  });
});
