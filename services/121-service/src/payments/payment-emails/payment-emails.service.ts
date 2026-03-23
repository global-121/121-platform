import { Injectable } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { PaymentEmailType } from '@121-service/src/payments/payment-emails/enum/payment-email-type.enum';
import { ApprovalConfirmationEmailInput } from '@121-service/src/payments/payment-emails/interfaces/approval-confirmation-email-input.interface';
import { ApprovalRequestEmailInput } from '@121-service/src/payments/payment-emails/interfaces/approval-request-email-input.interface';
import { buildTemplateApprovalConfirmation } from '@121-service/src/payments/payment-emails/templates/approval-confirmation.template';
import { buildTemplateApprovalRequest } from '@121-service/src/payments/payment-emails/templates/approval-request.template';

@Injectable()
export class PaymentEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async sendApprovalRequestToNextApprovers(
    input: ApprovalRequestEmailInput,
  ): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilders: {
        [PaymentEmailType.approvalRequestToNextApprovers]:
          buildTemplateApprovalRequest,
      },
      input,
      type: PaymentEmailType.approvalRequestToNextApprovers,
    });
  }

  public async sendApprovalConfirmationToCreator(
    input: ApprovalConfirmationEmailInput,
  ): Promise<void> {
    await this.emailsService.sendFromTemplate({
      templateBuilders: {
        [PaymentEmailType.approvalConfirmationToCreator]:
          buildTemplateApprovalConfirmation,
      },
      input,
      type: PaymentEmailType.approvalConfirmationToCreator,
    });
  }
}
