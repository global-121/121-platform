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
      await this.emailsService.sendGenericEmail({
        email: job.data.request.email,
        subject: 'Registration update - some records failed',
        body: `Some records failed to be updated. Please see the attached file for details.`,
        attachment: {
          filename: 'failed-updates.json',
          content: [JSON.stringify(failedValidations, null, 2)],
        },
      });
    }
  }
}
