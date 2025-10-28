import { Test, TestingModule } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { UserEmailType } from '@121-service/src/user/user-emails/enum/user-email-type.enum';
import { UserEmailInput } from '@121-service/src/user/user-emails/interfaces/user-email-input.interface';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

class EmailsServiceMock {
  sendEmail = jest.fn();
}

class UserEmailServiceMock {
  buildUserEmailTemplate = jest.fn();
}

describe('UserEmailsService', () => {
  let service: UserEmailsService;
  let emailsService: EmailsServiceMock;
  let userEmailsService: UserEmailServiceMock;

  beforeEach(async () => {
    emailsService = new EmailsServiceMock();
    userEmailsService = new UserEmailServiceMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEmailsService,
        { provide: EmailsService, useValue: emailsService },
      ],
    }).compile();
    service = module.get(UserEmailsService);
  });

  it('should send a user email with correct content', async () => {
    // Arrange
    const userEmailInput: UserEmailInput = {
      email: 'user@example.com',
      displayName: 'Test User',
      password: 'Secret123',
    };
    const userEmailType = UserEmailType.accountCreated;
    const expectedTemplate = {
      subject: 'Welcome!',
      body: '<b>Hello Test User</b>',
    };
    userEmailsService.buildUserEmailTemplate.mockReturnValue(expectedTemplate);

    // Act
    await service.sendUserEmail({
      userEmailInput,
      userEmailType,
    });

    // Assert
    expect(emailsService.sendEmail).toHaveBeenCalledWith({
      email: userEmailInput.email,
      subject: expectedTemplate.subject,
      body: expectedTemplate.body,
    });
  });
});
