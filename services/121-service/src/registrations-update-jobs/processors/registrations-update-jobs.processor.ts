import { Process } from '@nestjs/bull';
import { Scope } from '@nestjs/common';
import { Job } from 'bull';

import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { ProcessNameRegistration } from '@121-service/src/registration/enum/process-name-registration.enum';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/services/registrations-update-jobs.service';

@RegisteredProcessor(QueueNames.registration, Scope.REQUEST)
export class RegistrationsUpdateJobsProcessor {
  constructor(
    private readonly registrationsUpdateJobsService: RegistrationsUpdateJobsService,
  ) {}

  @Process(ProcessNameRegistration.update)
  public async handleUpdate(job: Job): Promise<void> {
    const jobData = job.data as RegistrationsUpdateJobDto;

    const failedValidations =
      await this.registrationsUpdateJobsService.processRegistrationsUpdateJob([
        jobData,
      ]);

    if (failedValidations.length) {
      // send email about failed validations
    }
  }
}
