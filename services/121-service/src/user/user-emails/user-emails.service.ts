import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { UserEmailType } from '@121-service/src/user/user-emails/enum/user-email-type.enum';
import { UserEmailInput } from '@121-service/src/user/user-emails/interfaces/user-email-input.interface';
import { buildTemplateAccountCreated } from '@121-service/src/user/user-emails/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/templates/password-reset.template';
import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

@Injectable()
export class UserEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async sendUserEmail({
    userEmailInput,
    userEmailType,
  }: {
    userEmailInput: UserEmailInput;
    userEmailType: UserEmailType;
  }): Promise<void> {
    const emailData: EmailData = this.buildUserEmailData(
      userEmailType,
      userEmailInput,
    );

    await this.emailsService.sendEmail(emailData);
  }

  private buildUserEmailData(
    userEmailType: UserEmailType,
    userEmailInput: UserEmailInput,
  ): EmailData {
    const { email, attachment } = userEmailInput;

    const template: EmailTemplate = this.buildUserEmailTemplate(
      userEmailType,
      userEmailInput,
    );

    const userEmailData: EmailData = {
      email,
      subject: template.subject,
      body: template.body,
      attachment,
    };

    return userEmailData;
  }

  private buildUserEmailTemplate(
    userEmailType: UserEmailType,
    userEmailInput: UserEmailInput,
  ): EmailTemplate {
    let emailTemplate: EmailTemplate;
    const sanitizedUserEmailInput = this.sanitizeUserEmailInput(userEmailInput);

    switch (userEmailType) {
      case UserEmailType.accountCreated:
        emailTemplate = buildTemplateAccountCreated(sanitizedUserEmailInput);
        break;
      case UserEmailType.accountCreatedForSSO:
        emailTemplate = buildTemplateAccountCreatedSSO(sanitizedUserEmailInput);
        break;
      case UserEmailType.passwordReset:
        emailTemplate = buildTemplatePasswordReset(sanitizedUserEmailInput);
        break;
    }

    return emailTemplate;
  }

  private sanitizeUserEmailInput(
    userEmailInput: UserEmailInput,
  ): UserEmailInput {
    const { displayName } = userEmailInput;
    return {
      ...userEmailInput,
      displayName: stripHtmlTags(displayName),
    };
  }
}
