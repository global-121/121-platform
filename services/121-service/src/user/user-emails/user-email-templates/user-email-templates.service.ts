import { Injectable } from '@nestjs/common';

import { EmailType } from '@121-service/src/user/user-emails/enum/email-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { EmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/email-template.interface';
import { emailTemplatePasswordReset } from '@121-service/src/user/user-emails/user-email-templates/templates/password-reset.template';
import { emailTemplateRegistrationCreation } from '@121-service/src/user/user-emails/user-email-templates/templates/registration-creation.template';
import { emailTemplateRegistrationCreationSSO } from '@121-service/src/user/user-emails/user-email-templates/templates/registration-creation-sso.template';

@Injectable()
export class UserEmailTemplatesService {
  public buildEmailTemplate(
    type: EmailType,
    userEmailTemplateInput: UserEmailTemplateInput,
  ): EmailTemplate {
    let emailTemplate: EmailTemplate;

    switch (type) {
      case EmailType.registrationCreation:
        emailTemplate = emailTemplateRegistrationCreation(
          userEmailTemplateInput,
        );
        break;
      case EmailType.registrationCreationSSO:
        emailTemplate = emailTemplateRegistrationCreationSSO(
          userEmailTemplateInput,
        );
        break;
      case EmailType.passwordReset:
        emailTemplate = emailTemplatePasswordReset(userEmailTemplateInput);
        break;
      default:
        throw new Error(`Unsupported email type: ${type}`);
    }

    return emailTemplate;
  }
}
