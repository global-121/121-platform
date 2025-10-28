import { Test, TestingModule } from '@nestjs/testing';

import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { UpdateJobEmailType } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/enum/update-job-email-type.enum';
import { RegistrationsUpdateJobEmailsService } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.service';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/registrations-update-jobs.service';
import { UserService } from '@121-service/src/user/user.service';

class RegistrationsServiceMock {
  validateInputAndUpdateRegistration = jest.fn();
}

class RegistrationsUpdateJobEmailsServiceMock {
  sendUpdateJobEmail = jest.fn();
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
  let registrationsUpdateJobEmailsService: RegistrationsUpdateJobEmailsServiceMock;

  beforeEach(async () => {
    registrationsService = new RegistrationsServiceMock();
    registrationsUpdateJobEmailsService =
      new RegistrationsUpdateJobEmailsServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsUpdateJobsService,
        { provide: RegistrationsService, useValue: registrationsService },
        {
          provide: RegistrationsUpdateJobEmailsService,
          useValue: registrationsUpdateJobEmailsService,
        },
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
    expect(
      registrationsUpdateJobEmailsService.sendUpdateJobEmail,
    ).not.toHaveBeenCalled();
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
    expect(
      registrationsUpdateJobEmailsService.sendUpdateJobEmail,
    ).toHaveBeenCalledTimes(1);

    expect(
      registrationsUpdateJobEmailsService.sendUpdateJobEmail,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        updateJobEmailType: UpdateJobEmailType.importValidationFailed,
        updateJobEmailInput: expect.objectContaining({
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
    const callArg =
      registrationsUpdateJobEmailsService.sendUpdateJobEmail.mock.calls[0][0];
    const decoded = Buffer.from(
      callArg.updateJobEmailInput.attachment.contentBytes,
      'base64',
    ).toString('utf8');
    expect(decoded).toContain('referenceId,error');
    // Expect proper CSV escaping: referenceId plain, error message quoted with internal quotes doubled
    expect(decoded).toContain(
      'reg-2,"Update failed, reason: ""bad, input"" for reg-2"',
    );
  });
});
