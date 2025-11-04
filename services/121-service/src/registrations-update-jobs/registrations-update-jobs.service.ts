import { HttpException, Injectable } from '@nestjs/common';

import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsUpdateJobDto } from '@121-service/src/registrations-update-jobs/dto/registrations-update-job.dto';
import { ErrorRecord } from '@121-service/src/registrations-update-jobs/interfaces/error-record.interface';
import { UpdateJobEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/update-job-email-input.interface';
import { RegistrationsUpdateJobEmailsService } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.service';
import { UserService } from '@121-service/src/user/user.service';
import { arrayToXlsx } from '@121-service/src/utils/send-xlsx-response';

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
    const registrationUpdateErrorRecords: ErrorRecord[] =
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
  ): Promise<ErrorRecord[]> {
    const registrationUpdateErrorRecords: ErrorRecord[] = [];

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
          registrationUpdateErrorRecords.push({
            referenceId: record.referenceId as string,
            errorMessage: String(error),
          });
        } else {
          throw error;
        }
      }
    }

    return registrationUpdateErrorRecords;
  }

  private async sendValidationFailureEmail(
    registrationUpdateErrorRecords: ErrorRecord[],
    userId: number,
  ): Promise<void> {
    const user = await this.userService.findById(userId);

    if (!user || !user.username) {
      throw new Error(
        'User not found or has no email address for validation failure email',
      );
    }

    const contentBytes = arrayToXlsx(registrationUpdateErrorRecords).toString(
      'base64',
    );

    const templateInput: UpdateJobEmailInput = {
      email: user.username,
      displayName: user.displayName,
      attachment: { name: 'failed-validations.xlsx', contentBytes },
    };

    await this.registrationsUpdateJobEmailsService.send(templateInput);
  }
}
