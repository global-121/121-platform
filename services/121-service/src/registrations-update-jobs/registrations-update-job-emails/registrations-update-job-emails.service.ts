import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { UpdateJobEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/update-job-email-input.interface';
import { buildTemplateImportValidationFailed } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/templates/import-validation-failed.template';

const templateBuilders: Record<
  'importValidationFailed',
  (input: UpdateJobEmailInput) => EmailTemplate
> = {
  importValidationFailed: buildTemplateImportValidationFailed,
};

@Injectable()
export class RegistrationsUpdateJobEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async send(updateJobEmailInput: UpdateJobEmailInput): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilders,
      input: updateJobEmailInput,
      type: 'importValidationFailed',
      attachment: updateJobEmailInput.attachment,
    });
  }
}
