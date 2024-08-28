import {
  CreateUserEmailPayload,
  GenericEmailPayload,
} from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsApiService } from '@121-service/src/emails/emails.api.service';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { createNonSSOUserTemplate } from '@121-service/src/emails/templates/createNonSsoUserTemplate';
import { createSSOUserTemplate } from '@121-service/src/emails/templates/createSsoUserTemplate';
import { genericTemplate } from '@121-service/src/emails/templates/genericTemplate';
import { passwordResetTemplate } from '@121-service/src/emails/templates/passwordResetTemplate';
import { Test } from '@nestjs/testing';

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
        subject: subject,
        body: body,
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
        subject: subject,
        body: body,
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
        subject: subject,
        body: body,
      }),
    );
  });

  it('should call sendEmail with correct payload for sendGenericEmail', async () => {
    const payload: GenericEmailPayload = {
      email: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
    };

    const { subject, body } = genericTemplate(payload.subject, payload.body);

    await emailsService.sendGenericEmail(payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        subject: subject,
        body: body,
      }),
    );
  });
});
