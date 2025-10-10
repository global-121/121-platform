import { emailBody } from '@121-service/src/emails/templates/body.helper';
import { supportEmail } from '@121-service/src/emails/templates/config.enum';

/**
 * Create e-mail message for failed phone number validation during registration import.
 */
export const failedPhoneNumberValidationTemplate = (
  displayName: string,
): {
  subject: string;
  body: string;
} => {
  const subject = 'Registration Import - Phone Number Validation Failed';

  const body = emailBody(`
    <p>Dear ${displayName},</p>
    <p>
      During your recent registration import, some phone numbers could not be validated.
    </p>
    <p>
      The registrations associated with these invalid phone numbers are listed in the attachment included with this email.<br>
      Please review the attached file, correct the phone numbers, and try importing again.
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
