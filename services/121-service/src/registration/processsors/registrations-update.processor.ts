import {
  ProcessNameRegistration,
  QueueNameRegistration,
} from '@121-service/src/notifications/enum/queue.names.enum';
import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';
import { Process, Processor } from '@nestjs/bull';
import { Scope } from '@nestjs/common';
import { Job } from 'bull';
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
    await this.registrationsService.updateRegistration(
      jobData.programId,
      jobData.referenceId,
      dto,
    );
  }
}
