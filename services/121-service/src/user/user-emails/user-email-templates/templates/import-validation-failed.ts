import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { UserEmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/user-email-template.interface';
import { SUPPORT_EMAIL } from '@121-service/src/user/user-emails/user-email-templates/template-constants';
import { wrapUserEmailContent } from '@121-service/src/user/user-emails/user-email-templates/template-content-wrapper';

/**
 * Create e-mail message for failed validations during registration import.
 */
export const buildTemplateImportValidationFailed = (
  userEmailTemplateInput: UserEmailTemplateInput,
): UserEmailTemplate => {
  const subject = 'Registration Import - Validation Failed';

  const body = wrapUserEmailContent(`
    <p>Dear ${userEmailTemplateInput.displayName},</p>
    <p>
      During your recent registration import, some registrations could not be validated.
    </p>
    <p>
      The registrations associated with invalid values are listed in the attachment included with this email.<br>
      Please review the attached file, correct invalid values, and try importing again.
    </p>
    <p>
      If you need assistance, please contact us at: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
    </p>
    <p>
      Best regards,<br>
      121 Support Team
    </p>
  `);

  return {
    subject,
    body,
  };
};
