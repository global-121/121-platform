import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';

import { DEFAULT_DISPLAY_NAME } from '@121-service/src/emails/emails.const';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { env } from '@121-service/src/env';
import { PaymentEmailType } from '@121-service/src/payments/payment-emails/enum/payment-email-type.enum';
import { buildTemplateApprovalConfirmation } from '@121-service/src/payments/payment-emails/templates/approval-confirmation.template';
import { buildTemplateApprovalRequest } from '@121-service/src/payments/payment-emails/templates/approval-request.template';

@Injectable()
export class PaymentEmailsService {
  constructor(private readonly emailsService: EmailsService) {}

  public async sendApprovalRequestToNextApprovers({
    paymentId,
    programId,
    approvers,
  }: {
    paymentId: number;
    programId: number;
    approvers: { emailAddress: string; recipientName: string | undefined }[];
  }): Promise<void> {
    const paymentUrl = this.getPaymentUrl(programId, paymentId);

    for (const approver of approvers) {
      await this.emailsService.sendFromTemplate({
        templateBuilders: {
          [PaymentEmailType.approvalRequestToNextApprovers]:
            buildTemplateApprovalRequest,
        },
        input: {
          email: approver.emailAddress,
          recipientName: approver.recipientName ?? DEFAULT_DISPLAY_NAME,
          paymentUrl,
        },
        type: PaymentEmailType.approvalRequestToNextApprovers,
      });
    }
  }

  public async sendApprovalConfirmationToCreator({
    paymentId,
    programId,
    paymentCreatedAt,
    paymentCreator,
  }: {
    paymentId: number;
    programId: number;
    paymentCreatedAt: Date;
    paymentCreator: { emailAddress: string; recipientName: string | undefined };
  }): Promise<void> {
    const formattedCreationDate = format(paymentCreatedAt, 'dd/MM/yyyy, HH:mm');

    const paymentUrl = this.getPaymentUrl(programId, paymentId);

    await this.emailsService.sendFromTemplate({
      templateBuilders: {
        [PaymentEmailType.approvalConfirmationToCreator]:
          buildTemplateApprovalConfirmation,
      },
      input: {
        email: paymentCreator.emailAddress,
        recipientName: paymentCreator.recipientName ?? DEFAULT_DISPLAY_NAME,
        paymentUrl,
        paymentCreatedAt: formattedCreationDate,
      },
      type: PaymentEmailType.approvalConfirmationToCreator,
    });
  }

  private getPaymentUrl = (programId: number, paymentId: number): string => {
    return `${env.REDIRECT_PORTAL_URL_HOST}/program/${programId}/payments/${paymentId}`;
  };
}
