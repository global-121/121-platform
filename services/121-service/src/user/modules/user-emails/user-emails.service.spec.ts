import { Test } from '@nestjs/testing';

import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { EmailType } from '@121-service/src/user/modules/user-emails/enum/email-type.enum';
import { getEmailBody } from '@121-service/src/user/modules/user-emails/helpers/get-body.helper';
import { getEmailSubject } from '@121-service/src/user/modules/user-emails/helpers/get-subject.helper';
import { EmailPayloadData } from '@121-service/src/user/modules/user-emails/interfaces/email-payload-data.interface';
import { EmailRecipient } from '@121-service/src/user/modules/user-emails/interfaces/email-recipient.interface';

// Mock for EmailsApiService
const mockEmailsApiService = {
  sendEmail: jest.fn(),
};

describe('EmailsService', () => {
  let emailsService: EmailsService;

  const emailRecipient: EmailRecipient = {
    email: 'test@example.com',
    displayName: 'testuser',
  };

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
    const payload: EmailPayloadData = {
      emailRecipient,
      password: 'testpassword',
    };
    const emailData: EmailData = {
      email: emailRecipient.email,
      subject: getEmailSubject(EmailType.registrationCreation),
      body: getEmailBody(EmailType.registrationCreation, payload),
    };

    await emailsService.sendEmail(emailData);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining(emailData),
    );
  });

  it('should call sendEmail with correct payload for passwordReset', async () => {
    const payload: EmailPayloadData = {
      emailRecipient,
      password: 'newpassword',
    };
    const emailData: EmailData = {
      email: emailRecipient.email,
      subject: getEmailSubject(EmailType.registrationCreation),
      body: getEmailBody(EmailType.registrationCreation, payload),
    };

    await emailsService.sendEmail(emailData);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining(emailData),
    );
  });

  it('should call sendEmail with correct payload for registrationCreationSSO', async () => {
    const payload: EmailPayloadData = {
      emailRecipient,
    };
    const emailData: EmailData = {
      email: emailRecipient.email,
      subject: getEmailSubject(EmailType.registrationCreation),
      body: getEmailBody(EmailType.registrationCreation, payload),
    };

    await emailsService.sendEmail(emailData);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining(emailData),
    );
  });
});
