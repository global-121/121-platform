import { buildTemplateApprovalConfirmation } from '@121-service/src/payments/payment-emails/templates/approval-confirmation.template';
import { buildTemplateApprovalRequest } from '@121-service/src/payments/payment-emails/templates/approval-request.template';

describe('Payment email templates', () => {
  const baseInput = {
    email: 'approver@example.org',
    recipientName: 'John Approver',
    paymentUrl: 'https://portal.example.org/program/1/payments/42',
  };

  it('should render approval request template', () => {
    expect(buildTemplateApprovalRequest(baseInput)).toMatchSnapshot();
  });

  it('should render approval confirmation template', () => {
    expect(
      buildTemplateApprovalConfirmation({
        ...baseInput,
        paymentCreatedAt: '15/03/2026, 14:30',
      }),
    ).toMatchSnapshot();
  });
});
