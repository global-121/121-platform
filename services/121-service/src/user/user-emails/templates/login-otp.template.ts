import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { LoginOtpEmailInput } from '@121-service/src/user/user-emails/interfaces/login-otp-email-input.interface';

export const buildTemplateLoginOtp = (
  userEmailInput: LoginOtpEmailInput,
): EmailTemplate => {
  const { recipientName, otp, expirationMinutes } = userEmailInput;

  const subject = 'Your 121 Portal sign-in code';
  const body = `
    <p>Hi ${recipientName},</p>
    <p>Use the code below to sign in to the 121 Portal:</p>
    <p style="font-size: 2.5em; margin: 0.75em 0;"><code>${otp}</code></p>
    <p>This code will expire in ${expirationMinutes} minutes.</p>
    <p>If you didn’t request this email, you can safely ignore it.</p>
  `;

  return { subject, body };
};
