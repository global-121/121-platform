import {
  CreateUserEmailPayload,
  GenericEmailPayload,
} from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsApiService } from '@121-service/src/emails/emails.api.service';
import { EmailsService } from '@121-service/src/emails/emails.service';
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

  it('should call sendEmail with correct payload for sendCreateUserEmail', async () => {
    const payload: CreateUserEmailPayload = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'testpassword',
      newUserMail: true,
    };

    await emailsService.sendCreateUserEmail(payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(payload);
  });

  it('should call sendEmail with correct payload for sendPasswordResetEmail', async () => {
    const payload: CreateUserEmailPayload = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'newpassword',
      newUserMail: false,
    };

    const criticalPieces = [
      `<p> Dear madam/sir, </p>`,
      `<p>Your password for the 121 Portal has been reset. You can access the 121 portal <a href="${process.env.EXTERNAL_121_SERVICE_URL}">here</a>.</p>`,
      `<p>Username: ${payload.username}</p>`,
      `<p>New Password: ${payload.password}</p>`,
      `<p>Please change your password immediately after logging in here: ${process.env.EXTERNAL_121_SERVICE_URL}user</p>`,
      `<p>If you did not request this password reset, please contact support immediately.</p>`,
      `<p>Kind regards,</p>`,
      `<p>121 support</p>`,
    ];

    await emailsService.sendPasswordResetEmail(payload);

    const { body } = mockEmailsApiService.sendEmail.mock.calls[0][0];

    criticalPieces.forEach((piece) => {
      expect(body).toContain(piece);
    });

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        subject: 'Your Password Reset Request',
      }),
    );
  });

  it('should call sendEmail with correct payload for sendGenericEmail', async () => {
    const payload: GenericEmailPayload = {
      email: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
    };

    await emailsService.sendGenericEmail(payload);

    expect(mockEmailsApiService.sendEmail).toHaveBeenCalledWith(payload);
  });
});
