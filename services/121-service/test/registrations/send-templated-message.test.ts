import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  awaitChangePaStatus,
  getMessageHistory,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { MessageTemplateEntity } from '../../src/notifications/message-template/message-template.entity';
import {
  getMessageTemplates,
  waitForMessagesToComplete,
} from '../helpers/program.helper';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';

describe('Send templated message on status change of PA', () => {
  const programId = 1; // status change templates are only available for LVV/PV
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
  let messageTemplates: MessageTemplateEntity[];

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationAh], accessToken);

    messageTemplates = (await getMessageTemplates(programId, accessToken)).body;
  });

  it('should send the templated inclusion message with placeholders processed, when including with sending message', async () => {
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
    const template = messageTemplates.filter(
      (t) =>
        t.type === statusChange &&
        t.language === registrationAh.preferredLanguage,
    )[0].message;
    const processedTemplate = template.replace(
      new RegExp('{{namePartnerOrganization}}', 'g'),
      registrationAh.namePartnerOrganization,
    ); //TODO: make this more flexible for other potential placeholders

    expect(messageHistory[0].body).toEqual(processedTemplate);
  });

  it('inclusion ended', async () => {
    // Arrange > include first to be able to end inclusion
    const statusChange = RegistrationStatusEnum.inclusionEnded;
    await awaitChangePaStatus(
      programId,
      [registrationAh.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );

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
    const template = messageTemplates.filter(
      (t) =>
        t.type === statusChange &&
        t.language === registrationAh.preferredLanguage,
    )[0].message;
    const processedTemplate = template.replace(
      new RegExp('{{namePartnerOrganization}}', 'g'),
      registrationAh.namePartnerOrganization,
    ); //TODO: make this more flexible for other potential placeholders

    expect(messageHistory[0].body).toEqual(processedTemplate);
  });

  it('rejected', async () => {
    // Arrange > include first to be able to reject
    const statusChange = RegistrationStatusEnum.rejected;
    await awaitChangePaStatus(
      programId,
      [registrationAh.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );

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
    const template = messageTemplates.filter(
      (t) =>
        t.type === statusChange &&
        t.language === registrationAh.preferredLanguage,
    )[0].message;
    const processedTemplate = template.replace(
      new RegExp('{{namePartnerOrganization}}', 'g'),
      registrationAh.namePartnerOrganization,
    ); //TODO: make this more flexible for other potential placeholders

    expect(messageHistory[0].body).toEqual(processedTemplate);
  });

  it.skip('invited', async () => {
    // TODO: this requires being able to pass a CSV to the /import-bulk endpoint or write a json version of that endpoint
  });
});
