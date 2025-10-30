import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as XLSX from 'xlsx';

import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsUpdateJobDto } from '@121-service/src/registrations-update-jobs/dto/registrations-update-job.dto';
import { RegistrationsUpdateJobEmailsService } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.service';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/registrations-update-jobs.service';
import { UserService } from '@121-service/src/user/user.service';

class RegistrationsServiceMock {
  validateInputAndUpdateRegistration = jest.fn();
}

class RegistrationsUpdateJobEmailsServiceMock {
  send = jest.fn();
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
    expect(registrationsUpdateJobEmailsService.send).not.toHaveBeenCalled();
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
          throw new HttpException(
            'Update failed, reason: "bad, input" for reg-2',
            HttpStatus.BAD_REQUEST,
          );
        }
      },
    );

    // Act
    await service.processRegistrationsUpdateJob(job);

    // Assert
    expect(registrationsUpdateJobEmailsService.send).toHaveBeenCalledTimes(1);

    // Extract the attachment and decode the XLSX
    const callArg = registrationsUpdateJobEmailsService.send.mock.calls[0][0];
    const { contentBytes } = callArg.attachment;
    const buffer = Buffer.from(contentBytes, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Header row and data row assertions
    expect(rows[0]).toEqual(['referenceId', 'errorMessage']);
    expect(rows[1]).toEqual([
      'reg-2',
      'HttpException: Update failed, reason: "bad, input" for reg-2',
    ]);
  });
});
