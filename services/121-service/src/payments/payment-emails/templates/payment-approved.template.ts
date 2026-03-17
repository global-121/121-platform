import { wrapWithEmailLayout } from '@121-service/src/emails/email-layout';
import { SUPPORT_EMAIL } from '@121-service/src/emails/emails.const';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { env } from '@121-service/src/env';
import { PaymentEmailInput } from '@121-service/src/payments/payment-emails/interfaces/payment-email-input.interface';

export const buildTemplatePaymentApproved = (
  paymentEmailInput: PaymentEmailInput,
): EmailTemplate => {
  const { displayName } = paymentEmailInput;

  const subject = '121 Portal payment approved';
  const body = wrapWithEmailLayout(`
    <p>Dear ${displayName},</p>
    <p>
      A payment you submitted has been approved in the 121 Portal.<br>
      To view the details, go to: <a href="${env.REDIRECT_PORTAL_URL_HOST}">${env.REDIRECT_PORTAL_URL_HOST}</a>
    </p>
    <p>
      For assistance, please contact: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
    </p>
    <p>
      Best regards,<br>
      121 Support Team
    </p>
  `);

  return { subject, body };
};
