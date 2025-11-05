import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { env } from 'process';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { AccountCreatedEvent } from '@121-service/src/user/events/account-created.event';
import { PasswordResetEvent } from '@121-service/src/user/events/password-reset.event';
import { UserEmailType } from '@121-service/src/user/user-emails/enum/user-email-type.enum';
import { UserEmailInput } from '@121-service/src/user/user-emails/interfaces/user-email-input.interface';
import { buildTemplateAccountCreated } from '@121-service/src/user/user-emails/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/templates/password-reset.template';
import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

@Injectable()
export class UserEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  @OnEvent('user.accountCreated')
  @OnEvent('user.passwordReset')
  public async handleUserEvent(
    payload: AccountCreatedEvent | PasswordResetEvent,
  ): Promise<void> {
    let userEmailType: UserEmailType | undefined;
    if (payload instanceof AccountCreatedEvent) {
      userEmailType = env.USE_SSO_AZURE_ENTRA
        ? UserEmailType.accountCreatedForSSO
        : UserEmailType.accountCreated;
    } else if (payload instanceof PasswordResetEvent) {
      userEmailType = UserEmailType.passwordReset;
    }

    if (!userEmailType) {
      throw new Error(
        'UserEmailType could not be determined from event payload',
      );
    }

    await this.sendUserEmail({
      userEmailInput: payload,
      userEmailType,
    });
  }

  public async sendUserEmail({
    userEmailInput,
    userEmailType,
  }: {
    userEmailInput: UserEmailInput;
    userEmailType: UserEmailType;
  }): Promise<void> {
    const emailData: EmailData = this.buildUserEmailData({
      userEmailType,
      userEmailInput,
    });

    await this.emailsService.sendEmail(emailData);
  }

  private buildUserEmailData({
    userEmailType,
    userEmailInput,
  }: {
    userEmailType: UserEmailType;
    userEmailInput: UserEmailInput;
  }): EmailData {
    const { email } = userEmailInput;

    const template: EmailTemplate = this.buildUserEmailTemplate({
      userEmailType,
      userEmailInput,
    });

    const userEmailData: EmailData = {
      email,
      subject: template.subject,
      body: template.body,
    };

    return userEmailData;
  }

  private buildUserEmailTemplate({
    userEmailType,
    userEmailInput,
  }: {
    userEmailType: UserEmailType;
    userEmailInput: UserEmailInput;
  }): EmailTemplate {
    let emailTemplate: EmailTemplate;
    const sanitizedUserEmailInput = {
      ...userEmailInput,
      displayName: stripHtmlTags(userEmailInput.displayName),
    };

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
}
