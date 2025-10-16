import { Test } from '@nestjs/testing';

import { EmailType } from '@121-service/src/emails/enum/email-type.enum';
import { getEmailBody } from '@121-service/src/emails/helpers/get-body.helper';
import { getEmailSubject } from '@121-service/src/emails/helpers/get-subject.helper';
import { EmailPayloadData } from '@121-service/src/emails/interfaces/email-payload-data.interface';
import { EmailRecipient } from '@121-service/src/emails/interfaces/email-recipient.interface';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

// Mock for EmailsApiService
const mockEmailsApiService = {
  sendEmail: jest.fn(),
};

describe('EmailsService', () => {
  let emailsService: EmailsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailsService,
        {
          provide: CustomHttpService,
          useValue: mockEmailsApiService,
        },
      ],
    }).compile();

    emailsService = moduleRef.get<EmailsService>(EmailsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call sendEmail with correct payload for registrationCreation', async () => {
    const emailRecipient: EmailRecipient = {
      email: 'test@example.com',
      displayName: 'testuser',
    };
    const payload: EmailPayloadData = {
      emailRecipient,
      password: 'testpassword',
    };

    await emailsService.sendEmail(EmailType.registrationCreation, payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: emailRecipient.email,
        subject: getEmailSubject(EmailType.registrationCreation),
        body: getEmailBody(EmailType.registrationCreation, payload),
      }),
    );
  });

  it('should call sendEmail with correct payload for passwordReset', async () => {
    const emailRecipient: EmailRecipient = {
      email: 'test@example.com',
      displayName: 'testuser',
    };
    const payload: EmailPayloadData = {
      emailRecipient,
      password: 'newpassword',
    };

    await emailsService.sendEmail(EmailType.passwordReset, payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: emailRecipient.email,
        subject: getEmailSubject(EmailType.passwordReset),
        body: getEmailBody(EmailType.passwordReset, payload),
      }),
    );
  });

  it('should call sendEmail with correct payload for registrationCreationSSO', async () => {
    const emailRecipient: EmailRecipient = {
      email: 'test@example.com',
      displayName: 'testuser',
    };
    const payload: EmailPayloadData = {
      emailRecipient,
    };

    await emailsService.sendEmail(EmailType.registrationCreationSSO, payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: emailRecipient.email,
        subject: getEmailSubject(EmailType.registrationCreationSSO),
        body: getEmailBody(EmailType.registrationCreationSSO, payload),
      }),
    );
  });
});
