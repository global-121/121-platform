import { wrapWithEmailLayout } from '@121-service/src/emails/email-layout';
import { SUPPORT_EMAIL } from '@121-service/src/emails/emails.const';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { PaymentEmailInput } from '@121-service/src/payments/payment-emails/interfaces/payment-email-input.interface';

export const buildTemplatePaymentApproved = (
  paymentEmailInput: PaymentEmailInput,
): EmailTemplate => {
  const { displayName, paymentUrl, paymentCreatedAt } = paymentEmailInput;

  const subject = '121 portal: Payment approved';
  const body = wrapWithEmailLayout(`
    <p>Dear ${displayName},</p>
    <p>
      The payment you created ${paymentCreatedAt} has been approved and is now ready to be initiated.
    </p>
    <p>Please follow the link below or log into the 121 portal to start the payment.</p>
    ${paymentUrl ? `<p><a href="${paymentUrl}">${paymentUrl}</a></p>` : ''}
    <p>Please note, the payment does not start automatically. Make sure to communicate with your team.</p>
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
