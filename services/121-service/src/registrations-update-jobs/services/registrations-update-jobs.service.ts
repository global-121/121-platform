import { Injectable } from '@nestjs/common';

import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

export interface RegistrationsUpdateJobResult {
  readonly referenceId: string;
  readonly data: Record<string, string | number | undefined | boolean>;
  readonly error: string;
}

@Injectable()
export class RegistrationsUpdateJobsService {
  constructor(private readonly registrationsService: RegistrationsService) {}

  public async processRegistrationsUpdateJob(
    registrationsUpdateJob: RegistrationsUpdateJobDto[],
  ): Promise<RegistrationsUpdateJobResult[]> {
    const results: RegistrationsUpdateJobResult[] = [];

    for (const registration of registrationsUpdateJob) {
      const result = await this.processRegistrationUpdate(registration);
      if (result) results.push(result);
    }

    return results;
  }

  private async processRegistrationUpdate(
    job: RegistrationsUpdateJobDto,
  ): Promise<RegistrationsUpdateJobResult | undefined> {
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
