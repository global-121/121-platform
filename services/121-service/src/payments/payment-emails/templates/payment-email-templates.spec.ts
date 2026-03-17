import { buildTemplatePaymentApproved } from '@121-service/src/payments/payment-emails/templates/payment-approved.template';
import { buildTemplatePendingApproval } from '@121-service/src/payments/payment-emails/templates/pending-approval.template';

describe('Payment email templates', () => {
  const baseInput = {
    email: 'approver@example.org',
    displayName: 'John Approver',
    paymentUrl: 'https://portal.example.org/program/1/payments/42',
  };

  it('should render pending approval template', () => {
    expect(buildTemplatePendingApproval(baseInput)).toMatchSnapshot();
  });

  it('should render payment approved template', () => {
    expect(
      buildTemplatePaymentApproved({
        ...baseInput,
        paymentCreatedAt: '15/03/2026, 14:30',
      }),
    ).toMatchSnapshot();
  });
});
