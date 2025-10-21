import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailType } from '@121-service/src/user/user-emails/enum/email-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { EmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/email-template.interface';
import { UserEmailTemplatesService } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.service';

@Injectable()
export class UserEmailsService {
  constructor(
    private readonly userEmailTemplatesService: UserEmailTemplatesService,
    private readonly emailsService: EmailsService,
  ) {}

  private buildUserEmailData(
    emailType: EmailType,
    userEmailTemplateInput: UserEmailTemplateInput,
  ): EmailData {
    const { email } = userEmailTemplateInput;

    const template: EmailTemplate =
      this.userEmailTemplatesService.buildEmailTemplate(
        emailType,
        userEmailTemplateInput,
      );

    const emailData: EmailData = {
      email,
      subject: template.subject,
      body: template.body,
    };

    return emailData;
  }

  public async sendUserEmail(
    userEmailTemplateInput: UserEmailTemplateInput,
    emailType: EmailType,
  ): Promise<void> {
    const emailData: EmailData = this.buildUserEmailData(
      emailType,
      userEmailTemplateInput,
    );

    await this.emailsService.sendEmail(emailData);
  }
}
