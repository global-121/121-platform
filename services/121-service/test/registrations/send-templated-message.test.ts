import { FinancialServiceProviderName } from '../../src/financial-service-providers/enum/financial-service-provider-name.enum';
import { MessageTemplateEntity } from '../../src/notifications/message-template/message-template.entity';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { LanguageEnum } from '../../src/shared/enum/language.enums';
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
import { getAccessToken, getServer, resetDB } from '../helpers/utility.helper';
import { programIdPV } from './pagination/pagination-data';

// this test is flaky, so we retry it before failing the whole 8-minute CI job just because of it
jest.retryTimes(2);

describe('Sending templated message', () => {
  const programId = programIdPV; // status change templates are only available for PV
  const registrationAh = {
    referenceId: '63e62864557597e0d-AH',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    nameFirst: 'John',
    nameLast: 'Smith',
    phoneNumber: '14155238886',
    fspName: FinancialServiceProviderName.intersolveVoucherPaper, // use SMS PA, so that template directly arrives
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
    it('sucessfully send include message', async () => {
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
        15_000,
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

    it('throw error if messageTemplateKey AND message are defined', async () => {
      // Arrange
      const statusChange = RegistrationStatusEnum.included;
      const templateKey = RegistrationStatusEnum.included;
      const message = 'Message';

      // Act
      const result = await getServer()
        .patch(`/programs/${programId}/registrations/status`)
        .set('Cookie', [accessToken])
        .query({})
        .send({
          status: statusChange,
          message: message,
          messageTemplateKey: templateKey,
        });
      // Assert
      expect(result.status).toBe(400);
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
        15_000,
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

    it('throw error if messageTemplateKey AND message are defined', async () => {
      // Arrange
      const templateKey = RegistrationStatusEnum.included;
      const message = 'Message';

      // Act
      const result = await sendMessage(
        accessToken,
        programId,
        [registrationAh.referenceId],
        message,
        templateKey,
      );

      // Assert
      expect(result.status).toBe(400);
    });

    it('throw error if neither messageTemplateKey AND message are defined', async () => {
      // Arrange
      const templateKey = null;
      const message = null;

      // Act
      const result = await sendMessage(
        accessToken,
        programId,
        [registrationAh.referenceId],
        message,
        templateKey,
      );

      // Assert
      expect(result.status).toBe(400);
    });
  });
});
