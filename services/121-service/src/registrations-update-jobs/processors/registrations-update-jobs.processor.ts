import { Process } from '@nestjs/bull';
import { Scope } from '@nestjs/common';
import { Job } from 'bull';

import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { ProcessNameRegistration } from '@121-service/src/registration/enum/process-name-registration.enum';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/services/registrations-update-jobs.service'; // send email about failed validations

@RegisteredProcessor(QueueNames.registration, Scope.REQUEST)
export class RegistrationsUpdateJobsProcessor {
  constructor(
    private readonly registrationsUpdateJobsService: RegistrationsUpdateJobsService,
    private readonly emailsService: EmailsService,
  ) {}

  @Process(ProcessNameRegistration.update)
  public async handleUpdate(job: Job): Promise<void> {
    const failedValidations =
      await this.registrationsUpdateJobsService.processRegistrationsUpdateJob(
        job.data,
      );

    if (failedValidations.length) {
      const validationsString = failedValidations.join(', ');

      await this.emailsService.sendPhoneNumberValidationFailedEmail({
        email: job.data.request.email,
        displayName: job.data.request.displayName,
        attachment: {
          name: 'attachment.csv',
          contentBytes: Buffer.from(validationsString, 'utf8').toString(
            'base64',
          ),
        },
      });
    }
  }
}
