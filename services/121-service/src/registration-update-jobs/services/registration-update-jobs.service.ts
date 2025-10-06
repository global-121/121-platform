import { Injectable } from '@nestjs/common';

import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

export interface RegistrationUpdateJobResult {
  readonly referenceId: string;
  readonly data: Record<string, string | number | undefined | boolean>;
  readonly error: string;
}

@Injectable()
export class RegistrationUpdateJobsService {
  constructor(private readonly registrationsService: RegistrationsService) {}

  public async processRegistrationUpdateJobs(
    registrationUpdateJobs: RegistrationsUpdateJobDto[],
  ): Promise<RegistrationUpdateJobResult[]> {
    const results: RegistrationUpdateJobResult[] = [];

    for (const job of registrationUpdateJobs) {
      const result = await this.processRegistrationUpdateJob(job);
      if (result) results.push(result);
    }

    return results;
  }

  private async processRegistrationUpdateJob(
    job: RegistrationsUpdateJobDto,
  ): Promise<RegistrationUpdateJobResult | undefined> {
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
      return {
        referenceId: job.referenceId,
        data: job.data,
        error: error.message,
      };
    }
  }
}
