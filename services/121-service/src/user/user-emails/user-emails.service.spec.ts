import { Test } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { EmailType } from '@121-service/src/user/user-emails/enum/email-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { EmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/email-template.interface';
import { UserEmailTemplatesService } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.service';

// Mock for CustomHttpService used by EmailsService
const mockHttpService = {
  post: jest.fn().mockResolvedValue(undefined),
};

describe('EmailsService', () => {
  let emailsService: EmailsService;
  let userEmailTemplatesService: UserEmailTemplatesService;

  const basePayload: Pick<UserEmailTemplateInput, 'email' | 'displayName'> = {
    email: 'test@example.com',
    displayName: 'testuser',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailsService,
        UserEmailTemplatesService,
        { provide: CustomHttpService, useValue: mockHttpService },
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
    const payload: UserEmailTemplateInput = {
      ...basePayload,
      password: 'testpassword',
    };
    const template: EmailTemplate =
      userEmailTemplatesService.buildEmailTemplate(
        EmailType.registrationCreation,
        payload,
      );
    const emailData: EmailData = {
      email: payload.email,
      subject: template.subject,
      body: template.body,
    };

    await emailsService.sendEmail(emailData);

    expect(mockHttpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining(emailData),
    );
  });

  it('should call sendEmail with correct payload for passwordReset', async () => {
    const payload: UserEmailTemplateInput = {
      ...basePayload,
      password: 'newpassword',
    };
    const template: EmailTemplate =
      userEmailTemplatesService.buildEmailTemplate(
        EmailType.passwordReset,
        payload,
      );
    const emailData: EmailData = {
      email: payload.email,
      subject: template.subject,
      body: template.body,
    };

    await emailsService.sendEmail(emailData);

    expect(mockHttpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining(emailData),
    );
  });

  it('should call sendEmail with correct payload for registrationCreationSSO', async () => {
    const payload: UserEmailTemplateInput = {
      ...basePayload,
    };
    const template: EmailTemplate =
      userEmailTemplatesService.buildEmailTemplate(
        EmailType.registrationCreationSSO,
        payload,
      );
    const emailData: EmailData = {
      email: payload.email,
      subject: template.subject,
      body: template.body,
    };

    await emailsService.sendEmail(emailData);

    expect(mockHttpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining(emailData),
    );
  });
});
