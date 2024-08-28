import { emailStyle } from '@121-service/src/emails/templates/style';

export const createSSOUserTemplate = (
  email: string,
  displayName: string,
): { subject: string; body: string } => {
  const subject = '121 Portal account created';

  const body = `
   ${emailStyle()}

    <div class="content">
      <p>Dear ${displayName},</p>
      <p>You have been added to the 121 Portal by the platform admin. Click <a href="${process.env.REDIRECT_PORTAL_URL_HOST}">here</a> to log in.</p>
      <br>
      <p>Account email: ${email}</p>
      <br>
      <p>For assistance, if you were not expecting this email or believe it was sent to you by mistake, please contact <a href="mailto:support@121.global">support@121.global</a></p>
      <p>Best regards,</p>
      <p>121 Portal Team</p>
    </div>
  `;

  return { subject, body };
};
