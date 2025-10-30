import { Test, TestingModule } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { UserEmailType } from '@121-service/src/user/user-emails/enum/user-email-type.enum';
import { UserEmailInput } from '@121-service/src/user/user-emails/interfaces/user-email-input.interface';
import { buildTemplateAccountCreated } from '@121-service/src/user/user-emails/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/templates/password-reset.template';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

jest.mock(
  '@121-service/src/user/user-emails/templates/account-created.template',
);
jest.mock(
  '@121-service/src/user/user-emails/templates/account-created-sso.template',
);
jest.mock(
  '@121-service/src/user/user-emails/templates/password-reset.template',
);

class EmailsServiceMock {
  public sendEmail = jest.fn();
}

const mockReturnAccountCreated = {
  subject: 'Account Created',
  body: 'mock-return-account-created',
};
const mockReturnAccountCreatedSSO = {
  subject: 'Account Created SSO',
  body: 'mock-return-account-created-sso',
};
const mockReturnPasswordReset = {
  subject: 'Password Reset',
  body: 'mock-return-password-reset',
};

describe('UserEmailsService', () => {
  let service: UserEmailsService;
  let emailsService: EmailsServiceMock;

  const buildTemplateAccountCreatedMock =
    buildTemplateAccountCreated as jest.MockedFunction<
      typeof buildTemplateAccountCreated
    >;
  const buildTemplateAccountCreatedSSOMock =
    buildTemplateAccountCreatedSSO as jest.MockedFunction<
      typeof buildTemplateAccountCreatedSSO
    >;
  const buildTemplatePasswordResetMock =
    buildTemplatePasswordReset as jest.MockedFunction<
      typeof buildTemplatePasswordReset
    >;

  beforeEach(async () => {
    emailsService = new EmailsServiceMock();

    buildTemplateAccountCreatedMock.mockReset();
    buildTemplateAccountCreatedSSOMock.mockReset();
    buildTemplatePasswordResetMock.mockReset();

    buildTemplateAccountCreatedMock.mockReturnValue(mockReturnAccountCreated);
    buildTemplateAccountCreatedSSOMock.mockReturnValue(
      mockReturnAccountCreatedSSO,
    );
    buildTemplatePasswordResetMock.mockReturnValue(mockReturnPasswordReset);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEmailsService,
        { provide: EmailsService, useValue: emailsService },
      ],
    }).compile();

    service = module.get(UserEmailsService);
  });

  interface Scenario {
    readonly description: string;
    readonly userEmailType: UserEmailType;
    readonly expectedTemplate: { subject: string; body: string };
  }

  const scenarios: Scenario[] = [
    {
      description: 'account created email',
      userEmailType: UserEmailType.accountCreated,
      expectedTemplate: mockReturnAccountCreated,
    },
    {
      description: 'account created for SSO email',
      userEmailType: UserEmailType.accountCreatedForSSO,
      expectedTemplate: mockReturnAccountCreatedSSO,
    },
    {
      description: 'password reset email',
      userEmailType: UserEmailType.passwordReset,
      expectedTemplate: mockReturnPasswordReset,
    },
  ];

  it.each(scenarios)(
    'should send $description using sanitized input and template output',
    async ({ expectedTemplate, userEmailType }) => {
      // Arrange
      const userEmailInput: UserEmailInput = {
        email: 'user@example.com',
        displayName: 'Test <b>User</b>',
        password: 'Secret123',
      };

      // Act
      await service.send({
        userEmailInput,
        userEmailType,
      });

      // Assert
      expect(emailsService.sendEmail).toHaveBeenCalledWith({
        email: userEmailInput.email,
        subject: expectedTemplate.subject,
        body: expectedTemplate.body,
      });
    },
  );
});
