import { SUPPORT_EMAIL } from '@121-service/src/emails/email-constants';
import { wrapWithEmailLayout } from '@121-service/src/emails/email-layout';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { env } from '@121-service/src/env';
import { UserEmailInput } from '@121-service/src/user/user-emails/interfaces/user-email-input.interface';

export const buildTemplateAccountCreated = (
  userEmailInput: UserEmailInput,
): EmailTemplate => {
  const { displayName, email, password } = userEmailInput;

  const subject = '121 Portal account created';
  const body = wrapWithEmailLayout(`
    <p>Dear ${displayName},</p>
    <p>
      You have been added to the 121 Portal by the platform admin.<br>
      To log in, go to: <a href="${env.REDIRECT_PORTAL_URL_HOST}">${env.REDIRECT_PORTAL_URL_HOST}</a>
    </p>
    <p>
      Username: ${email}<br>
      Password: <code>${password}</code>
    </p>
    <p>
      After logging in, please change your password on: <a href="${env.REDIRECT_PORTAL_URL_HOST}/change-password">${env.REDIRECT_PORTAL_URL_HOST}/change-password</a>
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
