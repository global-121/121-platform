import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { EmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/email-template.interface';
import { wrapEmailBody } from '@121-service/src/user/user-emails/user-email-templates/template-body-wrapper';
import {
  CHANGE_PASSWORD_URL,
  LOGIN_URL,
  SUPPORT_EMAIL,
} from '@121-service/src/user/user-emails/user-email-templates/template-constants';

export const emailTemplateRegistrationCreationSSO = (
  userEmailTemplateInput: UserEmailTemplateInput,
): EmailTemplate => {
  const { displayName, email, password } = userEmailTemplateInput;

  const subject = '121 Portal account created';
  const body = wrapEmailBody(`
    <p>Dear ${displayName},</p>
    <p>
      You have been added to the 121 Portal by the platform admin.<br>
      To log in, go to: <a href="${LOGIN_URL}">${LOGIN_URL}</a>
    </p>
    <p>
      Username: ${email}<br>
      Password: <code>${password}</code>
    </p>
    <p>
      After logging in, please change your password on: <a href="${CHANGE_PASSWORD_URL}">${CHANGE_PASSWORD_URL}</a>
    </p>
    <p>
      For assistance, if you were not expecting this email or believe it was sent to you by mistake,
      please contact: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
    </p>
    <p>
      Best regards,<br>
      121 Support Team
    </p>
  `);

  return { subject, body };
};
