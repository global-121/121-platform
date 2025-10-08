import { emailBody } from '@121-service/src/emails/templates/body.helper';

/**
 * Create e-mail message body, including default salutation and signature.
 * @param bodyMessage Text-only message.
 */
export const getEmailBody = (bodyMessage: string): string =>
  emailBody(`
    <p>Dear madam/sir,</p>
    <p>
      ${bodyMessage}
    </p>
    <p>
      Best regards,<br>
      121 Support Team
    </p>
  `);
