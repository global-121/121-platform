import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { ImportValidationFailedEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/import-validation-failed-email-input.interface';
import { buildTemplateImportValidationFailed } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/templates/import-validation-failed.template';

const templateBuilders: Record<
  'importValidationFailed',
  (input: ImportValidationFailedEmailInput) => EmailTemplate
> = {
  importValidationFailed: buildTemplateImportValidationFailed,
};

@Injectable()
export class RegistrationsUpdateJobEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async sendImportValidationFailed(
    input: ImportValidationFailedEmailInput,
  ): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilders,
      input,
      type: 'importValidationFailed',
      attachment: input.attachment,
    });
  }
}
