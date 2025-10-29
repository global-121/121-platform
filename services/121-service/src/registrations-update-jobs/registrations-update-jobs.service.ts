import { HttpException, Injectable } from '@nestjs/common';

import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { UpdateJobEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/update-job-email-input.interface';
import { RegistrationsUpdateJobEmailsService } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.service';
import { UserService } from '@121-service/src/user/user.service';
import {
  CSVRecord,
  formatRecordsAsCsv,
} from '@121-service/src/utils/format-records-as-csv.helper';

@Injectable()
export class RegistrationsUpdateJobsService {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly registrationsUpdateJobEmailsService: RegistrationsUpdateJobEmailsService,
    private readonly userService: UserService,
  ) {}

  public async processRegistrationsUpdateJob(
    job: RegistrationsUpdateJobDto,
  ): Promise<void> {
    const registrationUpdateErrorRecords: CSVRecord[] =
      await this.updateRegistrations(job);

    if (registrationUpdateErrorRecords.length > 0) {
      await this.sendValidationFailureEmail(
        registrationUpdateErrorRecords,
        job.request.userId,
      );
    }
  }

  private async updateRegistrations(
    job: RegistrationsUpdateJobDto,
  ): Promise<CSVRecord[]> {
    const registrationUpdateErrorRecords: CSVRecord[] = [];

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
        if (error instanceof HttpException) {
          throw error;
        } else {
          registrationUpdateErrorRecords.push({
            referenceId: record.referenceId as string,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return registrationUpdateErrorRecords;
  }

  private async sendValidationFailureEmail(
    registrationUpdateErrorRecords: CSVRecord[],
    userId: RegistrationsUpdateJobDto['request']['userId'],
  ): Promise<void> {
    const user = await this.userService.findById(userId);

    if (!user || !user.username) {
      throw new Error(
        'User not found or has no email address for validation failure email',
      );
    }

    const contentBytes = formatRecordsAsCsv(registrationUpdateErrorRecords);

    const templateInput: UpdateJobEmailInput = {
      email: user.username,
      displayName: user.displayName,
      attachment: { name: 'failed-validations.csv', contentBytes },
    };

    await this.registrationsUpdateJobEmailsService.sendUpdateJobEmail({
      updateJobEmailInput: templateInput,
    });
  }
}
