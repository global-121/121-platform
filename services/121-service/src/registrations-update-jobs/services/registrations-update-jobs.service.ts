import { Injectable } from '@nestjs/common';
import { env } from 'process';

import { FailedValidationEmailPayload } from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { UserService } from '@121-service/src/user/user.service';

export interface RegistrationsUpdateJobResult {
  readonly referenceId: string;
  readonly data: Record<string, string | number | undefined | boolean>;
  readonly error?: string;
}

@Injectable()
export class RegistrationsUpdateJobsService {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly emailsService: EmailsService,
    private readonly userService: UserService,
  ) {}

  public async processRegistrationsUpdateJob(
    job: RegistrationsUpdateJobDto,
  ): Promise<RegistrationsUpdateJobDto['data']> {
    const results: RegistrationsUpdateJobDto['data'] = [];

    for (const record of job.data) {
      const dto: UpdateRegistrationDto = {
        data: record,
        reason: job.reason,
      };

      try {
        const result =
          await this.registrationsService.validateInputAndUpdateRegistration({
            programId: job.programId,
            referenceId: record.referenceId as string,
            updateRegistrationDto: dto,
            userId: job.request.userId,
          });
        if (result) {
          results.push(record);
        }
      } catch (error) {
        throw new Error(error);
      }
    }

    return results;
  }

  public async handleJobCompletion(
    results: RegistrationsUpdateJobDto['data'],
    jobData: RegistrationsUpdateJobDto,
  ): Promise<void> {
    const failedResults = results.filter((result) => result.error);
    console.log('Failed results:', failedResults);
    if (failedResults.length > 0) {
      await this.sendValidationFailureNotification(failedResults, jobData);
    }
  }

  private async sendValidationFailureNotification(
    failedResults: RegistrationsUpdateJobDto['data'],
    jobData: RegistrationsUpdateJobDto,
  ): Promise<void> {
    const csvHeader = 'referenceId,error\n';
    const csvRows = failedResults
      .map((result) => `${result.id}, ${result.error}`)
      .join('\n');
    const csvContent = csvHeader + csvRows;

    const user = await this.userService.findById(jobData.request.userId);

    if (!user || !user.username) {
      throw new Error(
        'User not found or has no email address for validation failure notification',
      );
    }

    const emailPayload: FailedValidationEmailPayload = {
      email: env.MY_EMAIL_ADDRESS ?? '' /*user.username*/,
      displayName: user.displayName || 'sir/madam',
      attachment: {
        name: 'failed-phone-number-validations.csv',
        contentBytes: Buffer.from(csvContent, 'utf8').toString('base64'),
      },
    };

    await this.emailsService.sendValidationFailedEmail(emailPayload);
  }
}
