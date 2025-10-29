import { HttpException, Injectable } from '@nestjs/common';

import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationUpdateErrorRecord } from '@121-service/src/registrations-update-jobs/interfaces/registration-update-error-record.interface';
import { UpdateJobEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/update-job-email-input.interface';
import { RegistrationsUpdateJobEmailsService } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.service';
import { UserService } from '@121-service/src/user/user.service';

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
    const registrationUpdateErrorRecords: RegistrationUpdateErrorRecord[] =
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
  ): Promise<RegistrationUpdateErrorRecord[]> {
    const registrationUpdateErrorRecords: RegistrationUpdateErrorRecord[] = [];

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
    registrationUpdateErrorRecords: RegistrationUpdateErrorRecord[],
    userId: RegistrationsUpdateJobDto['request']['userId'],
  ): Promise<void> {
    const user = await this.userService.findById(userId);

    if (!user || !user.username) {
      throw new Error(
        'User not found or has no email address for validation failure email',
      );
    }

    const contentBytes = this.formatErrorRecordsAsCsv(
      registrationUpdateErrorRecords,
    );

    const templateInput: UpdateJobEmailInput = {
      email: user.username,
      displayName: user.displayName,
      attachment: { name: 'failed-validations.csv', contentBytes },
    };

    await this.registrationsUpdateJobEmailsService.sendUpdateJobEmail({
      updateJobEmailInput: templateInput,
    });
  }

  private formatErrorRecordsAsCsv(
    errorRecords: RegistrationUpdateErrorRecord[],
  ): string {
    const csvHeader = 'referenceId,error\n';

    const csvRows = errorRecords
      .map((record) => {
        const referenceId = this.escapeCsvValue(String(record.referenceId));
        const errorMessage = this.escapeCsvValue(String(record.errorMessage));
        return `${referenceId},${errorMessage}`;
      })
      .join('\n');

    const csvString = csvHeader + csvRows + '\n';
    const contentBytes = Buffer.from(csvString, 'utf8').toString('base64');
    return contentBytes;
  }

  private escapeCsvValue = (value: string): string => {
    const needsQuoting =
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r');
    let escaped = value.replace(/"/g, '""');
    if (needsQuoting) {
      escaped = `"${escaped}"`;
    }
    return escaped;
  };
}
