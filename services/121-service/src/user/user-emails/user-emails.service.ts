import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { AccountCreatedEmailInput } from '@121-service/src/user/user-emails/interfaces/account-created-email-input.interface';
import { AccountCreatedSsoEmailInput } from '@121-service/src/user/user-emails/interfaces/account-created-sso-email-input.interface';
import { PasswordResetEmailInput } from '@121-service/src/user/user-emails/interfaces/password-reset-email-input.interface';
import { buildTemplateAccountCreated } from '@121-service/src/user/user-emails/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/templates/password-reset.template';

@Injectable()
export class UserEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async sendAccountCreated(
    input: AccountCreatedEmailInput,
  ): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilder: buildTemplateAccountCreated,
      input,
    });
  }

  public async sendAccountCreatedForSSO(
    input: AccountCreatedSsoEmailInput,
  ): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilder: buildTemplateAccountCreatedSSO,
      input,
    });
  }

  public async sendPasswordReset(
    input: PasswordResetEmailInput,
  ): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilder: buildTemplatePasswordReset,
      input,
    });
  }
}
