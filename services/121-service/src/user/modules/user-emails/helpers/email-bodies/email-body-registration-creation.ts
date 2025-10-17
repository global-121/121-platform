import {
  LOGIN_URL,
  SUPPORT_EMAIL,
} from '@121-service/src/user/modules/user-emails/constants/constants';
import { EmailPayloadData } from '@121-service/src/user/modules/user-emails/interfaces/email-payload-data.interface';

export const emailBodyRegistrationCreation = (
  payloadData: EmailPayloadData,
): string => {
  const { displayName, email } = payloadData.emailRecipient;
  return `
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
  `;
};
