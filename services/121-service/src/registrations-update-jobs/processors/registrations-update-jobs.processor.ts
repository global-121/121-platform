import { Process } from '@nestjs/bull';
import { Scope } from '@nestjs/common';
import { Job } from 'bull';

import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';
import { RegisteredProcessor } from '@121-service/src/queues-registry/register-processor.decorator';
import { ProcessNameRegistration } from '@121-service/src/registration/enum/process-name-registration.enum';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/services/registrations-update-jobs.service';

@RegisteredProcessor(QueueNames.registration, Scope.REQUEST)
export class RegistrationsUpdateJobsProcessor {
  constructor(
    private readonly registrationsUpdateJobsService: RegistrationsUpdateJobsService,
  ) {}

  @Process(ProcessNameRegistration.update)
  public async handleUpdate(job: Job): Promise<void> {
    const result =
      await this.registrationsUpdateJobsService.processRegistrationsUpdateJob(
        job.data,
      );

    await this.registrationsUpdateJobsService.handleJobCompletion(
      result,
      job.data,
    );
  }
}
