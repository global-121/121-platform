import {
  changePasswordUrl,
  loginUrl,
  supportEmail,
} from '@121-service/src/emails/enum/config.enum';
import { EmailPayloadData } from '@121-service/src/emails/interfaces/email-payload-data.interface';

export const emailBodyPasswordReset = (
  payloadData: EmailPayloadData,
): string => {
  const {
    emailRecipient: { displayName, email },
    password,
  } = payloadData;
  return `
    <p>Dear ${displayName},</p>
    <p>
      Your password for the 121 Portal has been reset.<br>
      To log in again, go to: <a href="${loginUrl}">${loginUrl}</a>
    </p>
    <p>
      Username: ${email}<br>
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
  `;
};
