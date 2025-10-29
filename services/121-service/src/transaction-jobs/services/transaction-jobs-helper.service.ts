import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { UILanguageEnum } from '@121-service/src/shared/enum/ui-language.enum';
import { SaveTransactionProgressAndUpdateRegistrationContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-update-registration-context.interface';

@Injectable()
export class TransactionJobsHelperService {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
    private readonly transactionEventsService: TransactionEventsService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  public async getRegistrationOrThrow(
    referenceId: string,
  ): Promise<RegistrationEntity> {
    const registration =
      await this.registrationScopedRepository.getByReferenceId({
        referenceId,
      });
    if (!registration) {
      throw new Error(
        `Registration was not found for referenceId ${referenceId}`,
      );
    }
    return registration;
  }

  public async createInitiatedOrRetryTransactionEvent({
    context,
    isRetry,
  }: {
    context: TransactionEventCreationContext;
    isRetry: boolean;
  }) {
    await this.transactionEventsService.createEvent({
      context,
      type: isRetry
        ? TransactionEventType.retry
        : TransactionEventType.initiated,
      description: isRetry
        ? TransactionEventDescription.retry
        : TransactionEventDescription.initiated,
    });
  }

  private async addMessageJobToQueue({
    registration,
    userId,
    message,
    bulksize,
  }: {
    registration: RegistrationEntity | Omit<RegistrationViewEntity, 'data'>;
    userId: number;
    message?: string;
    bulksize?: number;
  }): Promise<void> {
    await this.queueMessageService.addMessageJob({
      registration,
      message,
      messageContentType: MessageContentType.payment,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      bulksize,
      userId,
    });
  }

  public async createMessageAndAddToQueue({
    type,
    programId,
    registration,
    amountTransferred,
    bulkSize,
    userId,
  }: {
    type: ProgramNotificationEnum;
    programId: number;
    registration: RegistrationEntity;
    amountTransferred: number;
    bulkSize: number;
    userId: number;
  }) {
    const templates =
      await this.messageTemplateService.getMessageTemplatesByProgramId(
        programId,
        type,
      );
    let messageContent = templates.find(
      (template) => template.language === registration.preferredLanguage,
    )?.message;
    if (!messageContent) {
      messageContent = templates.find(
        (template) => template.language === UILanguageEnum.en,
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

    await this.addMessageJobToQueue({
      registration,
      message: messageContent ?? undefined,
      bulksize: bulkSize,
      userId,
    });
  }

  public async saveTransactionProgressAndUpdateRegistration({
    context,
    newTransactionStatus,
    description,
    errorMessage,
  }: {
    context: SaveTransactionProgressAndUpdateRegistrationContext;
    newTransactionStatus: TransactionStatusEnum;
    description: TransactionEventDescription;
    errorMessage?: string;
  }): Promise<void> {
    if (!context.isRetry) {
      await this.updatePaymentCountAndSetToCompleted({
        referenceId: context.referenceId,
        userId: context.transactionEventContext.userId!,
      });
    }

    await this.transactionsService.saveProgress({
      context: context.transactionEventContext,
      description,
      errorMessage,
      newTransactionStatus,
    });
  }

  /**
   * Updates payment count and sets status to completed if applicable
   */
  public async updatePaymentCountAndSetToCompleted({
    referenceId,
    userId,
  }: {
    referenceId: string;
    userId: number;
  }): Promise<void> {
    const paymentCount =
      await this.transactionRepository.getPaymentCountByReferenceId(
        referenceId,
      );
    await this.registrationScopedRepository.updatePaymentCount({
      referenceId,
      paymentCount,
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
