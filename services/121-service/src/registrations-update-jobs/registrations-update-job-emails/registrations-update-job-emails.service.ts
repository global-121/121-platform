import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { UpdateJobEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/update-job-email-input.interface';
import { buildTemplateImportValidationFailed } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/templates/import-validation-failed.template';
import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

@Injectable()
export class RegistrationsUpdateJobEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async sendUpdateJobEmail({
    updateJobEmailInput,
  }: {
    updateJobEmailInput: UpdateJobEmailInput;
  }): Promise<void> {
    const emailData: EmailData =
      this.buildUpdateJobEmailData(updateJobEmailInput);

    await this.emailsService.sendEmail(emailData);
  }

  private buildUpdateJobEmailData(
    updateJobEmailInput: UpdateJobEmailInput,
  ): EmailData {
    const { email, attachment } = updateJobEmailInput;

    const sanitizedInput = {
      ...updateJobEmailInput,
      displayName: stripHtmlTags(updateJobEmailInput.displayName),
    };

    const template: EmailTemplate =
      buildTemplateImportValidationFailed(sanitizedInput);

    const updateJobEmailData: EmailData = {
      email,
      subject: template.subject,
      body: template.body,
      attachment,
    };

    return updateJobEmailData;
  }
}
