import { Test, TestingModule } from '@nestjs/testing';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { PaymentEmailType } from '@121-service/src/payments/payment-emails/enum/payment-email-type.enum';
import { PaymentEmailInput } from '@121-service/src/payments/payment-emails/interfaces/payment-email-input.interface';
import { PaymentEmailsService } from '@121-service/src/payments/payment-emails/payment-emails.service';
import { buildTemplatePaymentApproved } from '@121-service/src/payments/payment-emails/templates/payment-approved.template';
import { buildTemplatePendingApproval } from '@121-service/src/payments/payment-emails/templates/pending-approval.template';

jest.mock(
  '@121-service/src/payments/payment-emails/templates/pending-approval.template',
);
jest.mock(
  '@121-service/src/payments/payment-emails/templates/payment-approved.template',
);

class EmailsServiceMock {
  public sendFromTemplate = jest.fn();
}

describe('PaymentEmailsService', () => {
  let service: PaymentEmailsService;
  let emailsService: EmailsServiceMock;

  const buildTemplatePendingApprovalMock =
    buildTemplatePendingApproval as jest.MockedFunction<
      typeof buildTemplatePendingApproval
    >;
  const buildTemplatePaymentApprovedMock =
    buildTemplatePaymentApproved as jest.MockedFunction<
      typeof buildTemplatePaymentApproved
    >;

  beforeEach(async () => {
    emailsService = new EmailsServiceMock();

    buildTemplatePendingApprovalMock.mockReset();
    buildTemplatePaymentApprovedMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentEmailsService,
        { provide: EmailsService, useValue: emailsService },
      ],
    }).compile();

    service = module.get(PaymentEmailsService);
  });

  interface Scenario {
    readonly description: string;
    readonly paymentEmailType: PaymentEmailType;
    readonly expectedBuilder: jest.MockedFunction<
      (input: PaymentEmailInput) => { subject: string; body: string }
    >;
  }

  const scenarios: Scenario[] = [
    {
      description: 'pending approval email',
      paymentEmailType: PaymentEmailType.pendingApproval,
      expectedBuilder: buildTemplatePendingApproval as jest.MockedFunction<
        typeof buildTemplatePendingApproval
      >,
    },
    {
      description: 'payment approved email',
      paymentEmailType: PaymentEmailType.paymentApproved,
      expectedBuilder: buildTemplatePaymentApproved as jest.MockedFunction<
        typeof buildTemplatePaymentApproved
      >,
    },
  ];

  it.each(scenarios)(
    'should call the correct template builder for $description',
    async ({ expectedBuilder, paymentEmailType }) => {
      // Arrange
      const paymentEmailInput: PaymentEmailInput = {
        email: 'user@example.com',
        displayName: 'Test User',
        paymentUrl: 'https://example.com/program/1/payments/42',
        paymentCreatedAt: new Date('2025-06-20T12:51:00Z'),
      };

      // Act
      await service.send({ paymentEmailInput, paymentEmailType });

      // Assert
      const { templateBuilders } =
        emailsService.sendFromTemplate.mock.calls[0][0];
      expect(templateBuilders[paymentEmailType]).toBe(expectedBuilder);
    },
  );
});
