import { Process, Processor } from '@nestjs/bull';
import { Scope } from '@nestjs/common';
import { Job } from 'bull';
import {
  ProcessNameRegistration,
  QueueNameRegistration,
} from '../../notifications/enum/queue.names.enum';
import { RegistrationsUpdateJobDto } from '../dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '../dto/update-registration.dto';
import { RegistrationsService } from '../registrations.service';

const bulkUpdateReason = 'Changed via mass update';

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
      reason: bulkUpdateReason,
    };
    await this.registrationsService.updateRegistration(
      jobData.programId,
      jobData.referenceId,
      dto,
    );
  }
}
