import { HttpException, Injectable } from '@nestjs/common';

import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationUpdateErrorRecord } from '@121-service/src/registrations-update-jobs/interfaces/registration-update-error-record.interface';
import { UserService } from '@121-service/src/user/user.service';
import { UserEmailTemplateType } from '@121-service/src/user/user-emails/enum/user-email-template-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

@Injectable()
export class RegistrationsUpdateJobsService {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly userEmailsService: UserEmailsService,
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
        'User not found or has no email address for validation failure notification',
      );
    }

    const contentBytes = this.formatErrorRecordsAsCsv(
      registrationUpdateErrorRecords,
    );

    const userEmailTemplateInput: UserEmailTemplateInput = {
      email: user.username,
      displayName: user.displayName,
      attachment: {
        name: 'failed-validations.csv',
        contentBytes,
      },
    };

    await this.userEmailsService.sendUserEmail({
      userEmailTemplateInput,
      userEmailTemplateType: UserEmailTemplateType.importValidationFailed,
    });
  }

  private formatErrorRecordsAsCsv(
    errorRecords: RegistrationUpdateErrorRecord[],
  ): string {
    const csvHeader = 'referenceId, error\n';
    const csvRows = errorRecords
      .map((record) => `${record.referenceId}, ${record.errorMessage}`)
      .join('\n');
    const contentBytes = Buffer.from(csvHeader + csvRows, 'utf8').toString(
      'base64',
    );

    return contentBytes;
  }
}
