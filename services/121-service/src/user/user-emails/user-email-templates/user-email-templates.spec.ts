import { UserEmailTemplateType } from '@121-service/src/user/user-emails/enum/user-email-template-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { UserEmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/user-email-template.interface';
import * as AccountCreatedTemplate from '@121-service/src/user/user-emails/user-email-templates/templates/account-created.template';
import { UserEmailTemplatesService } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.service';

describe('UserEmailTemplatesService', () => {
  let service: UserEmailTemplatesService;

  beforeEach(() => {
    service = new UserEmailTemplatesService();
  });

  it('should build a template with sanitized input', () => {
    // Arrange
    const input: UserEmailTemplateInput = {
      email: 'user@example.com',
      displayName: '<b>Test User</b>',
      password: 'Secret123',
    };
    const sanitizedInput: UserEmailTemplateInput = {
      ...input,
      displayName: 'Test User',
    };
    const mockBuilder = jest
      .spyOn(AccountCreatedTemplate, 'buildTemplateAccountcreated')
      .mockReturnValue({ subject: 'mock', body: 'mock' });

    // Act
    service.buildUserEmailTemplate(UserEmailTemplateType.accountCreated, input);

    // Assert
    expect(mockBuilder).toHaveBeenCalledWith(sanitizedInput);
  });

  it('should return a template given the right template type and input', () => {
    // Arrange
    const input: UserEmailTemplateInput = {
      email: 'user@example.com',
      displayName: 'Test User',
      password: 'Secret123',
    };
    const expectedTemplate: UserEmailTemplate = {
      subject: 'Test Subject',
      body: 'Test Body',
    };
    jest
      .spyOn(AccountCreatedTemplate, 'buildTemplateAccountcreated')
      .mockReturnValue(expectedTemplate);

    // Act
    const template = service.buildUserEmailTemplate(
      UserEmailTemplateType.accountCreated,
      input,
    );

    // Assert
    expect(template).toEqual(expectedTemplate);
  });
});
