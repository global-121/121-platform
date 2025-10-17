import { Test } from '@nestjs/testing';

import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { EmailType } from '@121-service/src/user/user-emails/enum/email-type.enum';
import { EmailPayloadData } from '@121-service/src/user/user-emails/interfaces/email-payload-data.interface';
import { EmailRecipient } from '@121-service/src/user/user-emails/interfaces/email-recipient.interface';
import { EmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/email-template.interface';
import { UserEmailTemplatesService } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.service';

// Mock for EmailsApiService
const mockEmailsApiService = {
  sendEmail: jest.fn(),
};

describe('EmailsService', () => {
  let emailsService: EmailsService;
  let userEmailTemplatesService: UserEmailTemplatesService;

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
    userEmailTemplatesService = moduleRef.get<UserEmailTemplatesService>(
      UserEmailTemplatesService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call sendEmail with correct payload for registrationCreation', async () => {
    const payload: EmailPayloadData = {
      emailRecipient,
      password: 'testpassword',
    };
    const template: EmailTemplate =
      userEmailTemplatesService.buildEmailTemplate(
        EmailType.registrationCreationSSO,
        payload,
      );
    const emailData: EmailData = {
      email: emailRecipient.email,
      ...template,
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
    const template: EmailTemplate =
      userEmailTemplatesService.buildEmailTemplate(
        EmailType.registrationCreationSSO,
        payload,
      );
    const emailData: EmailData = {
      email: emailRecipient.email,
      ...template,
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
    const template: EmailTemplate =
      userEmailTemplatesService.buildEmailTemplate(
        EmailType.registrationCreationSSO,
        payload,
      );
    const emailData: EmailData = {
      email: emailRecipient.email,
      ...template,
    };

    await emailsService.sendEmail(emailData);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining(emailData),
    );
  });
});
