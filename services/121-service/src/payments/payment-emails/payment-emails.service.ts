import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { EmailTemplate } from '@121-service/src/emails/interfaces/email-template.interface';
import { PaymentEmailType } from '@121-service/src/payments/payment-emails/enum/payment-email-type.enum';
import { PaymentEmailInput } from '@121-service/src/payments/payment-emails/interfaces/payment-email-input.interface';
import { buildTemplatePaymentApproved } from '@121-service/src/payments/payment-emails/templates/payment-approved.template';
import { buildTemplatePendingApproval } from '@121-service/src/payments/payment-emails/templates/pending-approval.template';
import { stripHtmlTags } from '@121-service/src/utils/strip-html-tags.helper';

const templateBuilders: Record<
  PaymentEmailType,
  (input: PaymentEmailInput) => EmailTemplate
> = {
  [PaymentEmailType.pendingApproval]: buildTemplatePendingApproval,
  [PaymentEmailType.paymentApproved]: buildTemplatePaymentApproved,
};

@Injectable()
export class PaymentEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async send({
    paymentEmailInput,
    paymentEmailType,
  }: {
    paymentEmailInput: PaymentEmailInput;
    paymentEmailType: PaymentEmailType;
  }): Promise<void> {
    const sanitizedPaymentEmailInput = {
      ...paymentEmailInput,
      displayName: stripHtmlTags(paymentEmailInput.displayName),
    };
    const template = templateBuilders[paymentEmailType](
      sanitizedPaymentEmailInput,
    );
    const emailData = this.emailsService.buildEmailData({
      email: sanitizedPaymentEmailInput.email,
      template,
    });
    await this.emailsService.sendEmail(emailData);
  }
}
