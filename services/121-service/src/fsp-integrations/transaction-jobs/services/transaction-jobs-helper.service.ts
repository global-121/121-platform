import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

@Injectable()
export class TransactionJobsHelperService {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationsService: RegistrationsService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  public async createMessageAndAddToQueue({
    type,
    programId,
    referenceId,
    amountTransferred,
    bulkSize,
    userId,
    preferredLanguage,
  }: {
    type: ProgramNotificationEnum;
    programId: number;
    referenceId: string;
    amountTransferred: number;
    bulkSize: number;
    userId: number;
    preferredLanguage: RegistrationPreferredLanguage | null;
  }): Promise<void> {
    const templates =
      await this.messageTemplateService.getMessageTemplatesByProgramId(
        programId,
        type,
      );
    let messageContent = templates.find(
      (template) => template.language === preferredLanguage,
    )?.message;
    if (!messageContent) {
      messageContent = templates.find(
        (template) => template.language === RegistrationPreferredLanguage.en,
      )?.message;
    }
    // Note: messageContent is possible undefined/null here, so we're assuming here that the message processor will handle this properly.

    if (messageContent) {
      const dynamicContents = [String(amountTransferred)];
      for (const [i, dynamicContent] of dynamicContents.entries()) {
        const replaceString = `[[${i + 1}]]`;
        if (messageContent!.includes(replaceString)) {
          messageContent = messageContent!.replace(
            replaceString,
            dynamicContent,
          );
        }
      }
    }

    await this.registrationsService.createMessageJobForRegistration({
      referenceId,
      programId,
      extendedMessageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      message: messageContent ?? undefined,
      messageContentType: MessageContentType.payment,
      bulkSize,
      userId,
    });
  }

  /**
   * Logs the start of a transaction job.
   *
   * 1. Creates a transaction event with description 'initiated' or 'retry' based on the isRetry flag.
   * 2. Sets the transaction status to 'waiting'.
   * 3. If the transaction is of type 'initiated', updates the payment count for the associated registration.
   */
  public async logTransactionJobStart({
    context,
    isRetry,
  }: {
    context: TransactionEventCreationContext;
    isRetry: boolean;
  }) {
    await this.transactionsService.saveProgress({
      context,
      description: isRetry
        ? TransactionEventDescription.retry
        : TransactionEventDescription.initiated,
      newTransactionStatus: TransactionStatusEnum.waiting,
    });
    if (!isRetry) {
      await this.updatePaymentCountAndSetToCompleted({
        transactionId: context.transactionId,
        userId: context.userId!,
      });
    }
  }

  /**
   * Updates payment count and sets status to completed if applicable
   */
  private async updatePaymentCountAndSetToCompleted({
    transactionId,
    userId,
  }: {
    transactionId: number;
    userId: number;
  }): Promise<void> {
    const referenceId =
      await this.transactionRepository.getReferenceIdByTransactionIdOrThrow(
        transactionId,
      );
    const newPaymentCount =
      await this.transactionRepository.countStartedTransactionsByReferenceId(
        referenceId,
      );
    await this.registrationScopedRepository.updatePaymentCount({
      referenceId,
      paymentCount: newPaymentCount,
    });

    await this.setStatusToCompletedIfApplicable({
      referenceId,
      userId,
    });
  }

  /**
   * Checks program settings and completes registrations when applicable.
   */
  public async setStatusToCompletedIfApplicable({
    referenceId,
    userId,
  }: {
    referenceId: string;
    userId: number;
  }): Promise<void> {
    const registrationWithProgram =
      await this.registrationScopedRepository.findOneOrFail({
        where: { referenceId: Equal(referenceId) },
        relations: { program: true },
      });
    const program = registrationWithProgram.program;
    if (!program.enableMaxPayments) {
      return;
    }

    const shouldChangeStatusToCompleted =
      await this.registrationScopedRepository.shouldChangeStatusToCompleted({
        referenceId,
      });
    if (!shouldChangeStatusToCompleted) {
      return;
    }

    const isTemplateAvailable =
      await this.messageTemplateService.isTemplateAvailable(
        program.id,
        RegistrationStatusEnum.completed,
      );
    const messageContentDetails: MessageContentDetails = isTemplateAvailable
      ? {
          messageTemplateKey: RegistrationStatusEnum.completed,
          messageContentType: MessageContentType.completed,
          message: '',
        }
      : {};

    await this.registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds(
      {
        referenceIds: [referenceId],
        programId: program.id,
        registrationStatus: RegistrationStatusEnum.completed,
        userId,
        messageContentDetails,
      },
    );
  }
}
