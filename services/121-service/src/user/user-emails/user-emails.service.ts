import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { UserEmailTemplateType } from '@121-service/src/user/user-emails/enum/user-email-template-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { UserEmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/user-email-template.interface';
import { UserEmailTemplatesService } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.service';

@Injectable()
export class UserEmailsService {
  constructor(
    private readonly userEmailTemplatesService: UserEmailTemplatesService,
    private readonly emailsService: EmailsService,
  ) {}

  private buildUserEmailData(
    userEmailTemplateType: UserEmailTemplateType,
    userEmailTemplateInput: UserEmailTemplateInput,
  ): EmailData {
    const { email, attachment } = userEmailTemplateInput;

    const template: UserEmailTemplate =
      this.userEmailTemplatesService.buildUserEmailTemplate(
        userEmailTemplateType,
        userEmailTemplateInput,
      );

    const userEmailData: EmailData = {
      email,
      subject: template.subject,
      body: template.body,
      attachment,
    };

    return userEmailData;
  }

  public async sendUserEmail({
    userEmailTemplateInput,
    userEmailTemplateType,
  }: {
    userEmailTemplateInput: UserEmailTemplateInput;
    userEmailTemplateType: UserEmailTemplateType;
  }): Promise<void> {
    const emailData: EmailData = this.buildUserEmailData(
      userEmailTemplateType,
      userEmailTemplateInput,
    );

    await this.emailsService.sendEmail(emailData);
  }
}
