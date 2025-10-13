import { emailBody } from '@121-service/src/emails/templates/body.helper';
import { supportEmail } from '@121-service/src/emails/templates/config.enum';

/**
 * Create e-mail message for failed validations during registration import.
 */
export const failedValidationTemplate = (
  displayName: string,
): {
  subject: string;
  body: string;
} => {
  const subject = 'Registration Import - Validation Failed';

  const body = emailBody(`
    <p>Dear ${displayName ?? 'Sir/Madam'},</p>
    <p>
      During your recent registration import, some registrations could not be validated.
    </p>
    <p>
      The registrations associated with invalid values are listed in the attachment included with this email.<br>
      Please review the attached file, correct invalid values, and try importing again.
    </p>
    <p>
      If you need assistance, please contact us at: <a href="mailto:${supportEmail}">${supportEmail}</a>
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
