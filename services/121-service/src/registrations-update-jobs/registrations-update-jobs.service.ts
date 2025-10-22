import { Injectable } from '@nestjs/common';
import { env } from 'process';

import { RegistrationsUpdateJobDto } from '@121-service/src/registration/dto/registration-update-job.dto';
import { UpdateRegistrationDto } from '@121-service/src/registration/dto/update-registration.dto';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
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
    const failedResults: RegistrationsUpdateJobDto['data'] =
      await this.updateRegistrations(job);

    if (failedResults.length > 0) {
      await this.sendValidationFailureEmail(failedResults, job.request.userId);
    }
  }

  private async updateRegistrations(
    job: RegistrationsUpdateJobDto,
  ): Promise<RegistrationsUpdateJobDto['data']> {
    const failedResults: RegistrationsUpdateJobDto['data'] = [];

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
        failedResults.push({
          ...record,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return failedResults;
  }

  private async sendValidationFailureEmail(
    failedResults: RegistrationsUpdateJobDto['data'],
    userId: RegistrationsUpdateJobDto['request']['userId'],
  ): Promise<void> {
    const csvHeader = 'referenceId, error\n';
    const csvRows = failedResults
      .map((result) => `${result.referenceId}, ${result.error}`)
      .join('\n');
    const csvContent = csvHeader + csvRows;

    const user = await this.userService.findById(userId);

    if (!user || !user.username) {
      throw new Error(
        'User not found or has no email address for validation failure notification',
      );
    }

    //todo: rm before merging
    if (!env.MY_EMAIL_ADDRESS) {
      throw new Error('MY_EMAIL_ADDRESS environment variable is not set');
    }

    const userEmailTemplateInput: UserEmailTemplateInput = {
      //todo: change back to user.username before merging
      email: env.MY_EMAIL_ADDRESS,
      displayName: user.displayName,
      attachment: {
        name: 'failed-validations.csv',
        contentBytes: Buffer.from(csvContent, 'utf8').toString('base64'),
      },
    };

    await this.userEmailsService.sendUserEmail({
      userEmailTemplateInput,
      userEmailTemplateType: UserEmailTemplateType.importValidationFailed,
    });
  }
}
