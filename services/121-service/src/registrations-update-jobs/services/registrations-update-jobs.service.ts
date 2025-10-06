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
    job: RegistrationsUpdateJobDto,
  ): Promise<RegistrationsUpdateJobResult[]> {
    const results: RegistrationsUpdateJobResult[] = [];

    for (const record of job.data) {
      const dto: UpdateRegistrationDto = {
        data: record,
        reason: job.reason,
      };
      try {
        await this.registrationsService.validateInputAndUpdateRegistration({
          programId: job.programId,
          referenceId: record.referenceId as string,
          updateRegistrationDto: dto,
          userId: job.request.userId,
        });
      } catch (error) {
        results.push({
          referenceId: record.referenceId as string,
          data: record,
          error: error.message,
        });
      }
    }

    return results;
  }
}
