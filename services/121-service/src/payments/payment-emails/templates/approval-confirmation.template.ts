import { SUPPORT_EMAIL } from '@121-service/src/emails/emails.const';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { ApprovalConfirmationEmailInput } from '@121-service/src/payments/payment-emails/interfaces/approval-confirmation-email-input.interface';

export const buildTemplateApprovalConfirmation = (
  paymentEmailInput: ApprovalConfirmationEmailInput,
): EmailTemplate => {
  const { recipientName, paymentUrl, paymentCreatedAt } = paymentEmailInput;

  const subject = '121 portal: Payment approved';
  const body = `
    <p>Dear ${recipientName},</p>
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
  `;

  return { subject, body };
};
