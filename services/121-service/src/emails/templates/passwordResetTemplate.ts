import { emailStyle } from '@121-service/src/emails/templates/style';

export const passwordResetTemplate = (
  displayName: string,
  username: string,
  password: string,
): { subject: string; body: string } => {
  const subject = '121 Portal password reset';

  const body = `
    ${emailStyle()}

    <div>
        <p>Dear ${displayName},</p>
        <p>Your password for the 121 Portal has been reset. Click <a href="${process.env.REDIRECT_PORTAL_URL_HOST}">here</a> to log in again.</p>
        <br>
        <p>Username: ${username}</p>
        <p>Password: ${password}</p>
        <br>
        <p>After logging in, please change your password here: ${process.env.REDIRECT_PORTAL_URL_HOST}/user</p>
        <p>For assistance, if you were not expecting this email or believe it was sent to you by mistake, please contact <a href="mailto:support@121.global">support@121.global</a></p>
        <p>Best regards,</p>
        <p>121 Portal Team</p>
    </div>
  `;

  return { subject, body };
};
