import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { SENSITIVE_HTML_CONTENT_ATTRIBUTE } from '@121-service/src/shared/consts/sensitive-html-content-attribute.const';
import { LoginOtpEmailInput } from '@121-service/src/user/user-emails/interfaces/login-otp-email-input.interface';

export const buildTemplateLoginOtp = (
  userEmailInput: LoginOtpEmailInput,
): EmailTemplate => {
  const { recipientName, otp, expirationMinutes } = userEmailInput;

  const subject = 'Your 121 Portal sign-in code';
  const body = `
    <p>Hi ${recipientName},</p>
    <p>Use the code below to sign in to the 121 Portal:</p>
    <p ${SENSITIVE_HTML_CONTENT_ATTRIBUTE} style="font-size: 2.5em; margin: 0.75em 0;">${otp}</p>
    <p>This code will expire in ${expirationMinutes} minutes.</p>
    <p>If you didn’t request this email, you can safely ignore it.</p>
  `;

  return { subject, body };
};
