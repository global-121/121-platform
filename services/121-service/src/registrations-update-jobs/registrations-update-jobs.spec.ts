import { Test, TestingModule } from '@nestjs/testing';

import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/registrations-update-jobs.service';
import { UserService } from '@121-service/src/user/user.service';
import { UserEmailTemplateType } from '@121-service/src/user/user-emails/enum/user-email-template-type.enum';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

class RegistrationsServiceMock {
  validateInputAndUpdateRegistration = jest.fn();
}

class UserEmailsServiceMock {
  sendUserEmail = jest.fn();
}

class UserServiceMock {
  findById = jest.fn().mockResolvedValue({
    id: 456,
    username: 'owner@example.com',
    displayName: 'Owner User',
  });
}

describe('RegistrationsUpdateJobsService', () => {
  let service: RegistrationsUpdateJobsService;
  let registrationsService: RegistrationsServiceMock;
  let userEmailsService: UserEmailsServiceMock;

  beforeEach(async () => {
    registrationsService = new RegistrationsServiceMock();
    userEmailsService = new UserEmailsServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsUpdateJobsService,
        { provide: RegistrationsService, useValue: registrationsService },
        { provide: UserEmailsService, useValue: userEmailsService },
        { provide: UserService, useClass: UserServiceMock },
      ],
    }).compile();

    service = module.get<RegistrationsUpdateJobsService>(
      RegistrationsUpdateJobsService,
    );
  });

  it('should process registrations update job successfully', async () => {
    // Arrange
    const job: RegistrationsUpdateJobDto = {
      programId: 123,
      reason: 'Updating registrations',
      data: [
        { referenceId: 'reg-1', customAttribute: 'value1' },
        { referenceId: 'reg-2', customAttribute: 'value2' },
      ],
      request: { userId: 456 },
    };

    // Act
    await service.processRegistrationsUpdateJob(job);

    // Assert
    expect(
      registrationsService.validateInputAndUpdateRegistration,
    ).toHaveBeenCalledTimes(2);
    expect(userEmailsService.sendUserEmail).not.toHaveBeenCalled();
  });

  it('should process registrations update job with some failures and send email', async () => {
    // Arrange
    const job: RegistrationsUpdateJobDto = {
      programId: 123,
      reason: 'Updating registrations',
      data: [
        { referenceId: 'reg-1', customAttribute: 'value1' },
        { referenceId: 'reg-2', customAttribute: 'value2' },
      ],
      request: { userId: 456 },
    };

    registrationsService.validateInputAndUpdateRegistration.mockImplementation(
      async ({ referenceId }) => {
        if (referenceId === 'reg-2') {
          throw new Error('Update failed, reason: "bad, input" for reg-2');
        }
      },
    );

    // Act
    await service.processRegistrationsUpdateJob(job);

    // Assert
    expect(
      registrationsService.validateInputAndUpdateRegistration,
    ).toHaveBeenCalledTimes(2);
    expect(userEmailsService.sendUserEmail).toHaveBeenCalledTimes(1);

    expect(userEmailsService.sendUserEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userEmailTemplateType: UserEmailTemplateType.importValidationFailed,
        userEmailTemplateInput: expect.objectContaining({
          email: 'owner@example.com',
          displayName: 'Owner User',
          attachment: expect.objectContaining({
            name: 'failed-validations.csv',
            contentBytes: expect.any(String),
          }),
        }),
      }),
    );

    // Decode and verify attachment contains failing reference id and message
    const callArg = userEmailsService.sendUserEmail.mock.calls[0][0];
    const decoded = Buffer.from(
      callArg.userEmailTemplateInput.attachment.contentBytes,
      'base64',
    ).toString('utf8');
    expect(decoded).toContain('referenceId,error');
    // Expect proper CSV escaping: referenceId plain, error message quoted with internal quotes doubled
    expect(decoded).toContain(
      'reg-2,"Update failed, reason: ""bad, input"" for reg-2"',
    );
  });
});
