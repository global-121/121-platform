import { UserEmailTemplateInput } from '@121-service/src/user/user-emails/interfaces/user-email-template-input.interface';
import { UserEmailTemplate } from '@121-service/src/user/user-emails/user-email-templates/interfaces/user-email-template.interface';
import {
  LOGIN_URL,
  SUPPORT_EMAIL,
} from '@121-service/src/user/user-emails/user-email-templates/template-constants';
import { wrapUserEmailContent } from '@121-service/src/user/user-emails/user-email-templates/template-content-wrapper';

export const buildTemplateAccountCreatedSSO = (
  userEmailTemplateInput: UserEmailTemplateInput,
): UserEmailTemplate => {
  const { displayName, email } = userEmailTemplateInput;

  const subject = '121 Portal account created';
  const body = wrapUserEmailContent(`
    <p>Dear ${displayName},</p>
    <p>
      You have been added to the 121 Portal by the platform admin.<br>
      To log in, go to: <a href="${LOGIN_URL}">${LOGIN_URL}</a>
    </p>
    <p>
      Account e-mail: ${email}
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
