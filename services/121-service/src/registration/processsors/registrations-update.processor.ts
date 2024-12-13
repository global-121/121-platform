import { Process, Processor } from '@nestjs/bull';
import { Scope } from '@nestjs/common';
import { Job } from 'bull';

import { QueueNameRegistration } from '@121-service/src/queues/enum/queue-names-registration.enum';
import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { ProcessNameRegistration } from '@121-service/src/registration/enum/process-name-registration.enum';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';
@Processor({
  name: QueueNameRegistration.registration,
  scope: Scope.REQUEST,
})
export class RegistrationUpdateProcessor {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Process(ProcessNameRegistration.update)
  public async handleUpdate(job: Job): Promise<void> {
    const jobData = job.data as RegistrationsUpdateJobDto;
    const dto: UpdateRegistrationDto = {
      data: jobData.data,
      reason: jobData.reason,
    };
    await this.registrationsService.validateInputAndUpdateRegistration({
      programId: jobData.programId,
      referenceId: jobData.referenceId,
      updateRegistrationDto: dto,
      userId: jobData.request.userId,
    });
  }
}
