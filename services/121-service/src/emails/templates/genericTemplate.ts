import { emailBody } from '@121-service/src/emails/templates/body.helper';

/**
 * Create a basic e-mail message, including default salutation and signature.
 * @param subject The e-mail subject.
 * @param bodyMessage Text-only message.
 */
export const genericTemplate = (
  subject: string,
  bodyMessage: string,
): {
  subject: string;
  plainText: string;
} => {
  const plainText = emailBody(`
    <p>Dear madam/sir,</p>
    <p>
      ${bodyMessage}
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
