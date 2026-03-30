import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';

import { DEFAULT_DISPLAY_NAME } from '@121-service/src/emails/emails.const';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { env } from '@121-service/src/env';
import { buildTemplateApprovalConfirmation } from '@121-service/src/payments/payment-emails/templates/approval-confirmation.template';
import { buildTemplateApprovalRequest } from '@121-service/src/payments/payment-emails/templates/approval-request.template';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class PaymentEmailsService {
  constructor(
    private readonly emailsService: EmailsService,
    private readonly azureLogService: AzureLogService,
  ) {}

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
      try {
        await this.emailsService.sendFromTemplate({
          templateBuilder: buildTemplateApprovalRequest,
          input: {
            email: approver.emailAddress,
            recipientName: approver.recipientName ?? DEFAULT_DISPLAY_NAME,
            paymentUrl,
          },
        });
      } catch (error) {
        this.azureLogService.logError(
          new Error('Failed to send approval request email', { cause: error }),
          true,
        );
      }
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

    try {
      await this.emailsService.sendFromTemplate({
        templateBuilder: buildTemplateApprovalConfirmation,
        input: {
          email: paymentCreator.emailAddress,
          recipientName: paymentCreator.recipientName ?? DEFAULT_DISPLAY_NAME,
          paymentUrl,
          paymentCreatedAt: formattedCreationDate,
        },
      });
    } catch (error) {
      this.azureLogService.logError(
        new Error('Failed to send approval confirmation email', {
          cause: error,
        }),
        true,
      );
    }
  }

  private getPaymentUrl = (programId: number, paymentId: number): string => {
    return `${env.REDIRECT_PORTAL_URL_HOST}/program/${programId}/payments/${paymentId}`;
  };
}
