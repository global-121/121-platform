import { Injectable } from '@nestjs/common';

import { UserEmailTemplateType } from '@121-service/src/user/user-emails/enum/user-email-template-type.enum';
import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { UserEmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/user-email-template.interface';
import { buildTemplateAccountcreated } from '@121-service/src/user/user-emails/user-email-templates/templates/account-created.template';
import { buildTemplateAccountCreatedSSO } from '@121-service/src/user/user-emails/user-email-templates/templates/account-created-sso.template';
import { buildTemplatePasswordReset } from '@121-service/src/user/user-emails/user-email-templates/templates/password-reset.template';
import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

@Injectable()
export class UserEmailTemplatesService {
  public buildUserEmailTemplate(
    userEmailTemplateType: UserEmailTemplateType,
    userEmailTemplateInput: UserEmailTemplateInput,
  ): UserEmailTemplate {
    let emailTemplate: UserEmailTemplate;
    const sanitizedUserEmailTemplateInput = this.sanitizeUserEmailTemplateInput(
      userEmailTemplateInput,
    );

    switch (userEmailTemplateType) {
      case UserEmailTemplateType.accountCreated:
        emailTemplate = buildTemplateAccountcreated(
          sanitizedUserEmailTemplateInput,
        );
        break;
      case UserEmailTemplateType.accountCreatedForSSO:
        emailTemplate = buildTemplateAccountCreatedSSO(
          sanitizedUserEmailTemplateInput,
        );
        break;
      case UserEmailTemplateType.passwordReset:
        emailTemplate = buildTemplatePasswordReset(
          sanitizedUserEmailTemplateInput,
        );
        break;
      default:
        throw new Error(
          `Unsupported email type: ${sanitizedUserEmailTemplateInput}`,
        );
    }

    return emailTemplate;
  }

  private sanitizeUserEmailTemplateInput(
    userEmailTemplateInput: UserEmailTemplateInput,
  ): UserEmailTemplateInput {
    const { displayName } = userEmailTemplateInput;
    return {
      ...userEmailTemplateInput,
      displayName: stripHtmlTags(displayName),
    };
  }
}
