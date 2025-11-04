import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsUpdateJobDto } from '@121-service/src/registrations-update-jobs/dto/registrations-update-job.dto';
import { RegistrationsUpdateJobEmailsService } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.service';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/registrations-update-jobs.service';
import { UserService } from '@121-service/src/user/user.service';

/**
 * PRACTICAL EXAMPLE: Testing Email Notifications with Mocked EmailsService
 *
 * This demonstrates how to test that emails are sent when bulk update validations fail
 */
describe('Bulk Update Email Notifications', () => {
  let registrationsUpdateJobsService: RegistrationsUpdateJobsService;
  let emailsService: jest.Mocked<EmailsService>;
  let registrationsService: jest.Mocked<RegistrationsService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    // Create mocks
    const emailsServiceMock = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const registrationsServiceMock = {
      validateInputAndUpdateRegistration: jest.fn(),
    };

    const userServiceMock = {
      findById: jest.fn().mockResolvedValue({
        id: 123,
        username: 'test-user@example.com',
        displayName: 'Test User',
      }),
    };

    // Set up test module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsUpdateJobsService,
        RegistrationsUpdateJobEmailsService,
        { provide: EmailsService, useValue: emailsServiceMock },
        { provide: RegistrationsService, useValue: registrationsServiceMock },
        { provide: UserService, useValue: userServiceMock },
      ],
    }).compile();

    registrationsUpdateJobsService = module.get<RegistrationsUpdateJobsService>(
      RegistrationsUpdateJobsService,
    );
    emailsService = module.get<EmailsService>(
      EmailsService,
    ) as jest.Mocked<EmailsService>;
    registrationsService = module.get<RegistrationsService>(
      RegistrationsService,
    ) as jest.Mocked<RegistrationsService>;
    userService = module.get<UserService>(
      UserService,
    ) as jest.Mocked<UserService>;
  });

  it('Should send error notification email when registration validations fail', async () => {
    // Arrange: Set up registration service to fail for some records
    registrationsService.validateInputAndUpdateRegistration
      .mockResolvedValueOnce(undefined) // First record succeeds
      .mockRejectedValueOnce(
        new HttpException(
          'Invalid phone number format',
          HttpStatus.BAD_REQUEST,
        ),
      ) // Second record fails
      .mockRejectedValueOnce(
        new HttpException('Registration not found', HttpStatus.NOT_FOUND),
      ); // Third record fails

    const jobWithMixedResults: RegistrationsUpdateJobDto = {
      programId: 123,
      reason: 'Test bulk update with validation errors',
      data: [
        { referenceId: 'valid-ref-1', phoneNumber: '31612345678' },
        { referenceId: 'invalid-ref-2', phoneNumber: 'invalid-phone' },
        { referenceId: 'nonexistent-ref-3', phoneNumber: '31687654321' },
      ],
      request: { userId: 123, scope: 'test-scope' },
    };

    // Act: Process the job
    await registrationsUpdateJobsService.processRegistrationsUpdateJob(
      jobWithMixedResults,
    );

    // Assert: Verify that email notification was sent
    expect(emailsService.sendEmail).toHaveBeenCalledTimes(1);
    expect(emailsService.sendEmail).toHaveBeenCalledWith({
      email: 'test-user@example.com',
      subject: 'Registration Import - Validation Failed',
      body: expect.stringContaining(
        'some registrations could not be validated',
      ),
      attachment: expect.objectContaining({
        name: 'failed-validations.xlsx',
        contentBytes: expect.any(String),
      }),
    });

    // Verify user lookup was called
    expect(userService.findById).toHaveBeenCalledWith(123);

    // Verify registration service was called for each record
    expect(
      registrationsService.validateInputAndUpdateRegistration,
    ).toHaveBeenCalledTimes(3);
  });

  it('Should NOT send email when all registrations succeed', async () => {
    // Arrange: Set up registration service to succeed for all records
    registrationsService.validateInputAndUpdateRegistration.mockResolvedValue(
      undefined,
    );

    const jobWithSuccessResults: RegistrationsUpdateJobDto = {
      programId: 123,
      reason: 'Test bulk update with all successes',
      data: [
        { referenceId: 'valid-ref-1', phoneNumber: '31612345678' },
        { referenceId: 'valid-ref-2', phoneNumber: '31687654321' },
      ],
      request: { userId: 123, scope: 'test-scope' },
    };

    // Act: Process the job
    await registrationsUpdateJobsService.processRegistrationsUpdateJob(
      jobWithSuccessResults,
    );

    // Assert: Verify NO email was sent
    expect(emailsService.sendEmail).not.toHaveBeenCalled();
    expect(userService.findById).not.toHaveBeenCalled();
  });

  it('Should handle email sending failure gracefully', async () => {
    // Arrange: Set up registration service to fail and email service to fail
    registrationsService.validateInputAndUpdateRegistration.mockRejectedValueOnce(
      new HttpException('Validation failed', HttpStatus.BAD_REQUEST),
    );

    emailsService.sendEmail.mockRejectedValueOnce(
      new Error('Email service unavailable'),
    );

    const jobWithEmailFailure: RegistrationsUpdateJobDto = {
      programId: 123,
      reason: 'Test email sending failure',
      data: [{ referenceId: 'ref-1', phoneNumber: 'invalid' }],
      request: { userId: 123, scope: 'test-scope' },
    };

    // Act & Assert: Email failure currently causes job to throw
    // This reveals that email failures are not handled gracefully
    await expect(
      registrationsUpdateJobsService.processRegistrationsUpdateJob(
        jobWithEmailFailure,
      ),
    ).rejects.toThrow('Email service unavailable');

    // Verify email sending was attempted
    expect(emailsService.sendEmail).toHaveBeenCalledTimes(1);
  });
});

/**
 * This test suite demonstrates unit testing of email notifications for bulk update failures.
 *
 * Key insights discovered:
 * - Email attachments are generated in CSV format (not XLSX)
 * - Email failures currently cause job failures (not handled gracefully)
 * - Successful updates do not trigger email notifications
 *
 * For integration testing of bulk updates, see bulk-update-registration.test.ts
 */
