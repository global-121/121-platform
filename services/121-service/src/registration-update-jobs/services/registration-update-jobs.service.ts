import { Injectable } from '@nestjs/common';
import { forEach } from 'lodash';

import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

@Injectable()
export class RegistrationUpdateJobsService {
  constructor(private readonly registrationsService: RegistrationsService) {}

  public async processRegistrationUpdateJobs(
    registrationUpdateJobs: UpdateRegistrationDto[],
  ): Promise<void> {
    forEach(registrationUpdateJobs, async (job) => {
      const dto: UpdateRegistrationDto = {
        data: job.data,
        reason: job.reason,
      };
      try {
        await this.registrationsService.validateInputAndUpdateRegistration({
          programId: job.programId,
          referenceId: job.referenceId,
          updateRegistrationDto: dto,
          userId: job.request.userId,
        });
      } catch (error) {
        console.log(error);
        throw error;
      } finally {
        // send email if needed
      }
    });

    return;
  }
}
