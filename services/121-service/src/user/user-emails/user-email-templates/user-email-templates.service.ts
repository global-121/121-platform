import { Injectable } from '@nestjs/common';

import { UserEmailTemplateType } from '@121-service/src/user/user-emails/enum/user-email-template-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { UserEmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/user-email-template.interface';
import { buildTemplateAccountcreated } from '@121-service/src/user/user-emails/user-email-templates/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/user-email-templates/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/user-email-templates/templates/password-reset.template';

@Injectable()
export class UserEmailTemplatesService {
  public buildUserEmailTemplate(
    userEmailTemplateType: UserEmailTemplateType,
    userEmailTemplateInput: UserEmailTemplateInput,
  ): UserEmailTemplate {
    let emailTemplate: UserEmailTemplate;

    switch (userEmailTemplateType) {
      case UserEmailTemplateType.accountCreated:
        emailTemplate = buildTemplateAccountcreated(userEmailTemplateInput);
        break;
      case UserEmailTemplateType.accountCreatedForSSO:
        emailTemplate = buildTemplateAccountCreatedSSO(userEmailTemplateInput);
        break;
      case UserEmailTemplateType.passwordReset:
        emailTemplate = buildTemplatePasswordReset(userEmailTemplateInput);
        break;
      default:
        throw new Error(`Unsupported email type: ${userEmailTemplateType}`);
    }

    return emailTemplate;
  }
}
