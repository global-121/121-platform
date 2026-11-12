import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { LoginOneTimePasswordEmailInput } from '@121-service/src/user/user-emails/interfaces/login-one-time-password-email-input.interface';

export const buildTemplateLoginOneTimePassword = (
  userEmailInput: LoginOneTimePasswordEmailInput,
): EmailTemplate => {
  const { recipientName, oneTimePassword, expirationMinutes } = userEmailInput;

  const subject = 'Your 121 Portal sign-in code';
  const body = `
    <p>Hi ${recipientName},</p>
    <p>Use the code below to sign in to the 121 Portal:</p>
    <p style="font-size: 2.5em; margin: 0.75em 0;"><code>${oneTimePassword}</code></p>
    <p>This code will expire in ${expirationMinutes} minutes.</p>
    <p>If you didn’t request this email, you can safely ignore it.</p>
  `;

  return { subject, body };
};
