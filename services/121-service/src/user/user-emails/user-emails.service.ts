import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { UserEmailType } from '@121-service/src/user/user-emails/enum/user-email-type.enum';
import { UserEmailInput } from '@121-service/src/user/user-emails/interfaces/user-email-input.interface';
import { buildTemplateAccountCreated } from '@121-service/src/user/user-emails/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/templates/password-reset.template';

const templateBuilders: Record<
  UserEmailType,
  (input: UserEmailInput) => EmailTemplate
> = {
  [UserEmailType.accountCreated]: buildTemplateAccountCreated,
  [UserEmailType.accountCreatedForSSO]: buildTemplateAccountCreatedSSO,
  [UserEmailType.passwordReset]: buildTemplatePasswordReset,
};

@Injectable()
export class UserEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async send({
    userEmailInput,
    userEmailType,
  }: {
    userEmailInput: UserEmailInput;
    userEmailType: UserEmailType;
  }): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilders,
      input: userEmailInput,
      type: userEmailType,
    });
  }
}
