import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { MessageTemplateEntity } from '../../src/notifications/message-template/message-template.entity';
import { LanguageEnum } from '../../src/registration/enum/language.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { processMessagePlaceholders } from '../helpers/assert.helper';
import {
  getMessageTemplates,
  waitForMessagesToComplete,
} from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  getMessageHistory,
  importRegistrations,
  sendMessage,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { programIdPV } from './pagination/pagination-data';

describe('Send templated message', () => {
  const programId = programIdPV; // status change templates are only available for PV
  const registrationAh = {
    referenceId: '63e62864557597e0d-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    fspName: FspName.intersolveVoucherPaper, // use SMS PA, so that template directly arrives
    namePartnerOrganization: 'Test organization',
  };

  let accessToken: string;
  let messageTemplates: MessageTemplateEntity[];

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationAh], accessToken);

    messageTemplates = (await getMessageTemplates(programId, accessToken)).body;
  });
  describe('on status change of PA', () => {
    it('include', async () => {
      // Arrange
      const statusChange = RegistrationStatusEnum.included;

      // Act
      await awaitChangePaStatus(
        programId,
        [registrationAh.referenceId],
        statusChange,
        accessToken,
        null,
        true, // check the checkbox for sending templated message about status change
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
      const processedTemplate = processMessagePlaceholders(
        messageTemplates,
        registrationAh,
        statusChange,
        'namePartnerOrganization',
      );

      expect(messageHistory[0].body).toEqual(processedTemplate);
    });
  });

  describe('on custom message', () => {
    it('using the invite template', async () => {
      const templateKey = RegistrationStatusEnum.included;
      // Act
      await sendMessage(
        accessToken,
        programId,
        [registrationAh.referenceId],
        null,
        templateKey,
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
      const processedTemplate = processMessagePlaceholders(
        messageTemplates,
        registrationAh,
        templateKey,
        'namePartnerOrganization',
      );

      expect(messageHistory[0].body).toEqual(processedTemplate);
    });
  });
});
