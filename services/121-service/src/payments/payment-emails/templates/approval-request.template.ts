import { SUPPORT_EMAIL } from '@121-service/src/emails/emails.const';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { ApprovalRequestEmailInput } from '@121-service/src/payments/payment-emails/interfaces/approval-request-email-input.interface';

export const buildTemplateApprovalRequest = (
  paymentEmailInput: ApprovalRequestEmailInput,
): EmailTemplate => {
  const { displayName, paymentUrl } = paymentEmailInput;

  const subject = '121 portal: Payment approval';
  const body = `
    <p>Dear ${displayName},</p>
    <p>A new payment was created that requires your financial approval.</p>
    <p>Please follow the link below or log into the 121 portal, review the payment and approve.</p>
    ${paymentUrl ? `<p><a href="${paymentUrl}">${paymentUrl}</a></p>` : ''}
    <p>Please note, the payment will be ready to start after the final approval. Make sure to communicate with your team.</p>
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
