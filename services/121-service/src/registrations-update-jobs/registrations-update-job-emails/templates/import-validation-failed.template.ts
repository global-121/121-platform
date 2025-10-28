import { SUPPORT_EMAIL } from '@121-service/src/emails/email-constants';
import { wrapWithEmailLayout } from '@121-service/src/emails/email-layout';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { UpdateJobEmailInput } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/interfaces/update-job-email-input.interface';

/**
 * Create e-mail message for failed validations during registration import.
 */
export const buildTemplateImportValidationFailed = (
  updateJobEmailInput: UpdateJobEmailInput,
): EmailTemplate => {
  const subject = 'Registration Import - Validation Failed';

  const body = wrapWithEmailLayout(`
    <p>Dear ${updateJobEmailInput.displayName},</p>
    <p>
      During your recent registration import, some registrations could not be validated.
    </p>
    <p>
      The registrations associated with invalid values are listed in the attachment included with this email.<br>
      Please review the attached file, correct invalid values, and try importing again.<br>
      Note however that valid registrations have already been imported successfully.
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
