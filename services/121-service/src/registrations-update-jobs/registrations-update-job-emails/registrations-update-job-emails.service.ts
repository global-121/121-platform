import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { ImportValidationFailedEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/import-validation-failed-email-input.interface';
import { buildTemplateImportValidationFailed } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/templates/import-validation-failed.template';

@Injectable()
export class RegistrationsUpdateJobEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async sendImportValidationFailed(
    input: ImportValidationFailedEmailInput,
  ): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilder: buildTemplateImportValidationFailed,
      input,
      attachment: input.attachment,
    });
  }
}
