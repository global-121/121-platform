import { Test, TestingModule } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { UpdateJobEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/update-job-email-input.interface';
import { RegistrationsUpdateJobEmailsService } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.service';
import { buildTemplateImportValidationFailed } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/templates/import-validation-failed.template';

jest.mock(
  '@121-service/src/registrations-update-jobs/registrations-update-job-emails/templates/import-validation-failed.template',
);

class EmailsServiceMock {
  public sendEmail = jest.fn();
}

describe('RegistrationsUpdateJobEmailsService', () => {
  let service: RegistrationsUpdateJobEmailsService;
  let emailsService: EmailsServiceMock;

  const buildTemplateImportValidationFailedMock =
    buildTemplateImportValidationFailed as jest.MockedFunction<
      typeof buildTemplateImportValidationFailed
    >;

  beforeEach(async () => {
    emailsService = new EmailsServiceMock();

    buildTemplateImportValidationFailedMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsUpdateJobEmailsService,
        { provide: EmailsService, useValue: emailsService },
      ],
    }).compile();

    service = module.get(RegistrationsUpdateJobEmailsService);
  });

  it('should send import validation failed email using sanitized input and template output', async () => {
    // Arrange
    const updateJobEmailInput: UpdateJobEmailInput = {
      email: 'owner@example.com',
      displayName: 'Owner <i>User</i>',
      attachment: {
        name: 'failed-validations.csv',
        contentBytes: 'dGVzdC1kYXRh',
      },
    };
    const sanitizedInput: UpdateJobEmailInput = {
      ...updateJobEmailInput,
      displayName: 'Owner User',
    };
    const templateOutput = {
      subject: 'Validation failed',
      body: '<p>Some rows failed</p>',
    };

    buildTemplateImportValidationFailedMock.mockReturnValueOnce(templateOutput);

    // Act
    await service.sendUpdateJobEmail({
      updateJobEmailInput,
    });

    // Assert
    expect(buildTemplateImportValidationFailedMock).toHaveBeenCalledWith(
      sanitizedInput,
    );
    expect(emailsService.sendEmail).toHaveBeenCalledWith({
      email: updateJobEmailInput.email,
      subject: templateOutput.subject,
      body: templateOutput.body,
      attachment: updateJobEmailInput.attachment,
    });
  });
});
