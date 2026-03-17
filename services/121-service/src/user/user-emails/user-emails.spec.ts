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
  public sendFromTemplate = jest.fn();
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
    readonly expectedBuilder: jest.MockedFunction<
      (input: UserEmailInput) => { subject: string; body: string }
    >;
  }

  const scenarios: Scenario[] = [
    {
      description: 'account created email',
      userEmailType: UserEmailType.accountCreated,
      expectedBuilder: buildTemplateAccountCreated as jest.MockedFunction<
        typeof buildTemplateAccountCreated
      >,
    },
    {
      description: 'account created for SSO email',
      userEmailType: UserEmailType.accountCreatedForSSO,
      expectedBuilder: buildTemplateAccountCreatedSSO as jest.MockedFunction<
        typeof buildTemplateAccountCreatedSSO
      >,
    },
    {
      description: 'password reset email',
      userEmailType: UserEmailType.passwordReset,
      expectedBuilder: buildTemplatePasswordReset as jest.MockedFunction<
        typeof buildTemplatePasswordReset
      >,
    },
  ];

  it.each(scenarios)(
    'should call the correct template builder for $description',
    async ({ expectedBuilder, userEmailType }) => {
      // Arrange
      const userEmailInput: UserEmailInput = {
        email: 'user@example.com',
        displayName: 'Test User',
        password: 'Secret123',
      };

      // Act
      await service.send({ userEmailInput, userEmailType });

      // Assert
      const { templateBuilders } =
        emailsService.sendFromTemplate.mock.calls[0][0];
      expect(templateBuilders[userEmailType]).toBe(expectedBuilder);
    },
  );
});
