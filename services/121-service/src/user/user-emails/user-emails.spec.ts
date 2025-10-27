import { Test, TestingModule } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { UserEmailTemplateType } from '@121-service/src/user/user-emails/enum/user-email-template-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { UserEmailTemplatesService } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.service';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

class EmailsServiceMock {
  sendEmail = jest.fn();
}

class UserEmailTemplatesServiceMock {
  buildUserEmailTemplate = jest.fn();
}

describe('UserEmailsService', () => {
  let service: UserEmailsService;
  let emailsService: EmailsServiceMock;
  let templatesService: UserEmailTemplatesServiceMock;

  beforeEach(async () => {
    emailsService = new EmailsServiceMock();
    templatesService = new UserEmailTemplatesServiceMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEmailsService,
        { provide: EmailsService, useValue: emailsService },
        { provide: UserEmailTemplatesService, useValue: templatesService },
      ],
    }).compile();
    service = module.get(UserEmailsService);
  });

  it('should send a user email with correct content', async () => {
    // Arrange
    const userEmailTemplateInput: UserEmailTemplateInput = {
      email: 'user@example.com',
      displayName: 'Test User',
      password: 'Secret123',
    };
    const userEmailTemplateType = UserEmailTemplateType.accountCreated;
    const expectedTemplate = {
      subject: 'Welcome!',
      body: '<b>Hello Test User</b>',
    };
    templatesService.buildUserEmailTemplate.mockReturnValue(expectedTemplate);

    // Act
    await service.sendUserEmail({
      userEmailTemplateInput,
      userEmailTemplateType,
    });

    // Assert
    expect(emailsService.sendEmail).toHaveBeenCalledWith({
      email: userEmailTemplateInput.email,
      subject: expectedTemplate.subject,
      body: expectedTemplate.body,
    });
  });
});
