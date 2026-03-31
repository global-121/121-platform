import { SUPPORT_EMAIL } from '@121-service/src/emails/emails.const';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { env } from '@121-service/src/env';
import { AccountCreatedEmailInput } from '@121-service/src/user/user-emails/interfaces/account-created-email-input.interface';

export const buildTemplateAccountCreated = (
  userEmailInput: AccountCreatedEmailInput,
): EmailTemplate => {
  const { recipientName, email, password } = userEmailInput;

  const subject = '121 Portal account created';
  const body = `
    <p>Dear ${recipientName},</p>
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
  `;

  return { subject, body };
};
