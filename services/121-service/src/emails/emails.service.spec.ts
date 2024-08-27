import {
  CreateUserEmailPayload,
  GenericEmailPayload,
} from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsApiService } from '@121-service/src/emails/emails.api.service';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { genericTemplate } from '@121-service/src/emails/templates/generalTemplate';
import { passwordResetTemplate } from '@121-service/src/emails/templates/passwordResetTemplate';
import { createSSOUserTemplate } from '@121-service/src/emails/templates/welcomeSSOTemplate';
import { createNonSSOUserTemplate } from '@121-service/src/emails/templates/welcomeTemplate';
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
      username: 'testuser',
      password: 'testpassword',
    };

    const { subject, body } = createNonSSOUserTemplate(
      payload.username,
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
      username: 'testuser',
      password: 'newpassword',
    };

    const { subject, body } = passwordResetTemplate(
      payload.username,
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
    const username = 'testuser@example.com';

    const { subject, body } = createSSOUserTemplate(username);

    await emailsService.sendCreateSSOUserEmail(username);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: username,
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
