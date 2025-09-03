import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspSettingByNameOrThrow } from '@121-service/src/fsps/fsp-settings.helpers';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { waitForMessagesToComplete } from '@121-service/test/helpers/project.helper';
import {
  getMessageHistory,
  importRegistrations,
  sendMessage,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { projectIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('Send custom message with placeholders', () => {
  const projectId = projectIdPV;
  const registrationAh = {
    referenceId: '63e62864557597e0c-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 2,
    fullName: 'John Smith',
    phoneNumber: '14155238886',
    projectFspConfigurationName: Fsps.intersolveVoucherPaper, // use SMS PA, so that template directly arrives
    namePartnerOrganization: 'Test organization',
    maxPayments: 2,
    paymentCountRemaining: 2,
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await importRegistrations(projectId, [registrationAh], accessToken);
  });

  it('should send message with placeholder values processed', async () => {
    // Arrange
    const message =
      'This is a test message with {{namePartnerOrganization}} and {{paymentAmountMultiplier}} and {{projectFspConfigurationLabel}} and {{fullName}} and {{paymentCountRemaining}}';

    // Act
    await sendMessage(
      accessToken,
      projectId,
      [registrationAh.referenceId],
      message,
    );

    await waitForMessagesToComplete({
      projectId,
      referenceIds: [registrationAh.referenceId],
      accessToken,
    });

    const messageHistory = (
      await getMessageHistory(
        projectId,
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
    const labelInPreferredLanguage = getFspSettingByNameOrThrow(
      Fsps.intersolveVoucherPaper,
    ).defaultLabel[registrationAh.preferredLanguage];
    processedMessage = processedMessage.replace(
      new RegExp('{{projectFspConfigurationLabel}}', 'g'),
      labelInPreferredLanguage!,
    );
    processedMessage = processedMessage.replace(
      new RegExp('{{fullName}}', 'g'),
      registrationAh.fullName,
    );
    processedMessage = processedMessage.replace(
      new RegExp('{{paymentCountRemaining}}', 'g'),
      String(registrationAh.paymentCountRemaining),
    );

    expect(messageHistory[0].attributes.body).toEqual(processedMessage);
  });
});
