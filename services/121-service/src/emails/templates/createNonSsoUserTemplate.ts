import { emailBody } from '@121-service/src/emails/templates/body.helper';
import {
  changePasswordUrl,
  loginUrl,
  supportEmail,
} from '@121-service/src/emails/templates/config.enum';

export const createNonSSOUserTemplate = (
  displayName: string,
  username: string,
  password: string,
): {
  subject: string;
  plainText: string;
} => {
  const subject = '121 Portal account created';

  const plainText = emailBody(`
    <p>Dear ${displayName},</p>
    <p>
      You have been added to the 121 Portal by the platform admin.<br>
      To log in, go to: <a href="${loginUrl}">${loginUrl}</a>
    </p>
    <p>
      Username: ${username}<br>
      Password: <code>${password}</code>
    </p>
    <p>
      After logging in, please change your password on: <a href="${changePasswordUrl}">${changePasswordUrl}</a>
    </p>
    <p>
      For assistance, if you were not expecting this email or believe it was sent to you by mistake,
      please contact: <a href="mailto:${supportEmail}">${supportEmail}</a>
    </p>
    <p>
      Best regards,<br>
      121 Support Team
    </p>
  `);

  return {
    subject,
    plainText,
  };
};
