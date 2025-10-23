import { Test } from '@nestjs/testing';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { env } from '@121-service/src/env';
import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/registrations-update-jobs.service';
import { UserService } from '@121-service/src/user/user.service';
import { UserEmailTemplateType } from '@121-service/src/user/user-emails/enum/user-email-template-type.enum';
import { UserEmailsModule } from '@121-service/src/user/user-emails/user-emails.module';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

// This test will make a real email request if validation fails and env vars are set
// Remove before merge
describe('RegistrationsUpdateJobsService - integration with real email', () => {
  let registrationsUpdateJobsService: RegistrationsUpdateJobsService;
  let userEmailsService: UserEmailsService;

  beforeEach(async () => {
    const mockRegistrationsService = {
      validateInputAndUpdateRegistration: jest
        .fn()
        .mockRejectedValue(new Error('Invalid phone number format')),
    };

    const mockUserService = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        username: env.MY_EMAIL_ADDRESS || 'test@example.com',
        displayName: 'Test User',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [UserEmailsModule, EmailsModule],
      providers: [
        RegistrationsUpdateJobsService,
        { provide: RegistrationsService, useValue: mockRegistrationsService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();
    registrationsUpdateJobsService = moduleRef.get(
      RegistrationsUpdateJobsService,
    );
    userEmailsService = moduleRef.get(UserEmailsService);
  });

  it('should send a real email on failed validations', async () => {
    const job: RegistrationsUpdateJobDto = {
      data: [
        {
          referenceId: 'bfhihu1dcxn',
          phoneNumber: 'dit is geen telefoonnummer',
          maxPayments: '',
        },
        {
          referenceId: 'mk3sy2nq4mf',
          phoneNumber: '254200000003',
          maxPayments: '',
        },
        {
          referenceId: 'dputkp6bnil',
          phoneNumber: '254200000004',
          maxPayments: '',
        },
      ],
      programId: 2,
      reason: 'Test to see real email sent on failed validations',
      request: { userId: 1, scope: '' },
    };

    await expect(
      registrationsUpdateJobsService.processRegistrationsUpdateJob(job),
    ).resolves.not.toThrow();
  });

  it('should send a real account created email', async () => {
    if (!env.MY_EMAIL_ADDRESS) {
      console.log('Skipping real email test - MY_EMAIL_ADDRESS not set');
      return;
    }

    await expect(
      userEmailsService.sendUserEmail({
        userEmailTemplateInput: {
          email: env.MY_EMAIL_ADDRESS,
          displayName: 'Test User',
          password: 'TestPassword123!',
        },
        userEmailTemplateType: UserEmailTemplateType.accountCreated,
      }),
    ).resolves.not.toThrow();
  });
});
