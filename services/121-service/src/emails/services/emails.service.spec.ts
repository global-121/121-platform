import { Test } from '@nestjs/testing';

import {
  CreateUserEmailPayload,
  FailedValidationEmailPayload,
} from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsApiService } from '@121-service/src/emails/services/emails.api.service';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { createNonSSOUserTemplate } from '@121-service/src/emails/templates/createNonSsoUserTemplate';
import { createSSOUserTemplate } from '@121-service/src/emails/templates/createSsoUserTemplate';
import { failedValidationTemplate } from '@121-service/src/emails/templates/failedValidationTemplate';
import { passwordResetTemplate } from '@121-service/src/emails/templates/passwordResetTemplate';

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
          provide: EmailsApiService,
          useValue: mockEmailsApiService,
        },
      ],
    }).compile();

    emailsService = moduleRef.get<EmailsService>(EmailsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call sendEmail with correct payload for sendCreateNonSSOUserEmail', async () => {
    const payload: CreateUserEmailPayload = {
      email: 'test@example.com',
      displayName: 'testuser',
      password: 'testpassword',
    };

    const { subject, body } = createNonSSOUserTemplate(
      payload.displayName,
      payload.email,
      payload.password || '',
    );

    await emailsService.sendCreateNonSSOUserEmail(payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        subject,
        body,
      }),
    );
  });

  it('should call sendEmail with correct payload for sendPasswordResetEmail', async () => {
    const payload: CreateUserEmailPayload = {
      email: 'test@example.com',
      displayName: 'testuser',
      password: 'newpassword',
    };

    const { subject, body } = passwordResetTemplate(
      payload.displayName,
      payload.email,
      payload.password || '',
    );

    await emailsService.sendPasswordResetEmail(payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        subject,
        body,
      }),
    );
  });

  it('should call sendEmail with correct payload for sendCreateSSOUserEmail', async () => {
    const payload: CreateUserEmailPayload = {
      email: 'test@example.com',
      displayName: 'testuser',
    };

    const { subject, body } = createSSOUserTemplate(
      payload.email,
      payload.displayName,
    );

    await emailsService.sendCreateSSOUserEmail(payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        subject,
        body,
      }),
    );
  });

  it('should call sendEmail with correct payload for failedValidationEmail', async () => {
    const payload: FailedValidationEmailPayload = {
      email: 'test@example.com',
      displayName: 'testuser',
      attachment: {
        name: 'attachment.csv',
        contentBytes: Buffer.from('Test attachment content', 'utf8').toString(
          'base64',
        ),
      },
    };

    const { subject, body } = failedValidationTemplate(payload.displayName);

    await emailsService.sendValidationFailedEmail(payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        subject,
        body,
        attachment: payload.attachment,
      }),
    );
  });
});
