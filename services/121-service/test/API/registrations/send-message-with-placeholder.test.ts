import fspIntersolveJson from '../../../seed-data/fsp/fsp-intersolve-voucher-paper.json';
import { FspName } from '../../../src/fsp/enum/fsp-name.enum';
import { LanguageEnum } from '../../../src/registration/enum/language.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
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
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 2,
    fullName: 'John Smith',
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
    const message =
      'This is a test message with {{namePartnerOrganization}} and {{paymentAmountMultiplier}} and {{fspDisplayName[registrationAh.preferredLanguage]}} and {{fullName}}';

    // Act
    await sendMessage(
      accessToken,
      programId,
      [registrationAh.referenceId],
      message,
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
    let processedMessage = message.replace(
      new RegExp('{{namePartnerOrganization}}', 'g'),
      registrationAh.namePartnerOrganization,
    );
    processedMessage = processedMessage.replace(
      new RegExp('{{paymentAmountMultiplier}}', 'g'),
      String(registrationAh.paymentAmountMultiplier),
    );
    processedMessage = processedMessage.replace(
      new RegExp('{{fspDisplayNamePortal}}', 'g'),
      fspIntersolveJson.displayName[registrationAh.preferredLanguage],
    );
    processedMessage = processedMessage.replace(
      new RegExp('{{fullName}}', 'g'),
      registrationAh.fullName,
    );

    expect(messageHistory[0].body).toEqual(processedMessage);
  });
});
