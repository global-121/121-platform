import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { env } from 'process';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailData } from '@121-service/src/emails/interfaces/email-data.interface';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { AccountCreatedEvent } from '@121-service/src/user/events/account-created.event';
import { PasswordResetEvent } from '@121-service/src/user/events/password-reset.event';
import { buildTemplateAccountCreated } from '@121-service/src/user/user-emails/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/templates/password-reset.template';

@Injectable()
export class UserEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  @OnEvent('user.accountCreated')
  @OnEvent('user.passwordReset')
  public async handleUserEvent(
    payload: AccountCreatedEvent | PasswordResetEvent,
  ): Promise<void> {
    let emailTemplate: EmailTemplate | undefined;

    if (payload instanceof AccountCreatedEvent) {
      if (env.USE_SSO_AZURE_ENTRA) {
        emailTemplate = buildTemplateAccountCreatedSSO(payload);
      } else {
        emailTemplate = buildTemplateAccountCreated(payload);
      }
    } else if (payload instanceof PasswordResetEvent) {
      emailTemplate = buildTemplatePasswordReset(payload);
    }

    if (!emailTemplate) {
      throw new Error('No email template found for the given event payload');
    }

    const emailData: EmailData = {
      email: payload.email,
      subject: emailTemplate.subject,
      body: emailTemplate.body,
    };

    await this.emailsService.sendEmail(emailData);
  }
}
