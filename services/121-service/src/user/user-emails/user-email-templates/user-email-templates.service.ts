import { Injectable } from '@nestjs/common';

import { EmailType } from '@121-service/src/user/user-emails/enum/email-type.enum';
import { EmailPayloadData } from '@121-service/src/user/user-emails/interfaces/email-payload-data.interface';
import { EmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/email-template.interface';
import { emailTemplatePasswordReset } from '@121-service/src/user/user-emails/user-email-templates/templates/password-reset.template';
import { emailTemplateRegistrationCreation } from '@121-service/src/user/user-emails/user-email-templates/templates/registration-creation.template';
import { emailTemplateRegistrationCreationSSO } from '@121-service/src/user/user-emails/user-email-templates/templates/registration-creation-sso.template';

@Injectable()
export class UserEmailTemplatesService {
  public buildEmailTemplate(
    type: EmailType,
    payloadData: EmailPayloadData,
  ): EmailTemplate {
    let emailTemplate: EmailTemplate;

    switch (type) {
      case EmailType.registrationCreation:
        emailTemplate = emailTemplateRegistrationCreation(payloadData);
        break;
      case EmailType.registrationCreationSSO:
        emailTemplate = emailTemplateRegistrationCreationSSO(payloadData);
        break;
      case EmailType.passwordReset:
        emailTemplate = emailTemplatePasswordReset(payloadData);
        break;
      default:
        throw new Error(`Unsupported email type: ${type}`);
    }

    return emailTemplate;
  }
}
