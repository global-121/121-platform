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
    readonly templateBuilder: jest.MockedFunction<
      (input: UserEmailInput) => { subject: string; body: string }
    >;
  }

  const scenarios: Scenario[] = [
    {
      description: 'account created email',
      userEmailType: UserEmailType.accountCreated,
      templateBuilder: buildTemplateAccountCreatedMock,
    },
    {
      description: 'account created for SSO email',
      userEmailType: UserEmailType.accountCreatedForSSO,
      templateBuilder: buildTemplateAccountCreatedSSOMock,
    },
    {
      description: 'password reset email',
      userEmailType: UserEmailType.passwordReset,
      templateBuilder: buildTemplatePasswordResetMock,
    },
  ];

  it.each(scenarios)(
    'should send description using sanitized input and template output',
    async ({ userEmailType, templateBuilder }) => {
      // Arrange
      const userEmailInput: UserEmailInput = {
        email: 'user@example.com',
        displayName: 'Test <b>User</b>',
        password: 'Secret123',
      };
      const sanitizedInput: UserEmailInput = {
        ...userEmailInput,
        displayName: 'Test User',
      };
      const templateOutput = {
        subject: `${userEmailType} subject`,
        body: `<p>${userEmailType} body</p>`,
      };

      templateBuilder.mockReturnValueOnce(templateOutput);

      // Act
      await service.sendUserEmail({
        userEmailInput,
        userEmailType,
      });

      // Assert
      expect(templateBuilder).toHaveBeenCalledWith(sanitizedInput);
      expect(emailsService.sendEmail).toHaveBeenCalledWith({
        email: userEmailInput.email,
        subject: templateOutput.subject,
        body: templateOutput.body,
      });
    },
  );
});
