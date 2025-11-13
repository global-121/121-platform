import { Injectable } from '@nestjs/common';

import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { SaveTransactionProgressAndRelatedDataContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-related-data-context.interface';

@Injectable()
export class TransactionJobsHelperService {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
    private readonly transactionEventsService: TransactionEventsService,
    private readonly transactionsService: TransactionsService,
    private readonly programRepository: ProgramRepository,
    private readonly registrationsBulkService: RegistrationsBulkService,
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
        (template) => template.language === LanguageEnum.en,
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

  public async saveTransactionProgressAndUpdateRelatedData({
    newTransactionStatus,
    context,
    description,
    errorMessage,
  }: {
    newTransactionStatus: TransactionStatusEnum;
    context: SaveTransactionProgressAndRelatedDataContext;
    description: TransactionEventDescription;
    errorMessage?: string;
  }): Promise<void> {
    await this.updatePaymentCountAndSetToCompleted({
      referenceId: context.referenceId,
      programId: context.programId,
      userId: context.userId,
    });

    await this.transactionsService.saveTransactionProgress({
      context,
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
    programId,
    userId,
  }: {
    referenceId: string;
    programId: number;
    userId: number;
  }): Promise<void> {
    // ##TODO build in a check that we only update once per transaction. Specifically also not on retry!
    await this.registrationScopedRepository.increasePaymentCountByOne({
      referenceId,
    });

    await this.setStatusToCompletedIfApplicable({
      referenceId,
      programId,
      userId,
    });
  }

  /**
   * Checks program settings and completes registrations when applicable.
   * This mirrors the previous orchestration logic but has no external side-effects
   * beyond calling the registrationsBulkService to apply status changes and send messages.
   */
  public async setStatusToCompletedIfApplicable({
    referenceId,
    programId,
    userId,
  }: {
    referenceId: string;
    programId: number;
    userId: number;
  }): Promise<void> {
    const program = await this.programRepository.findByIdOrFail(programId);
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
        programId,
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
        referenceIds: [referenceId], // ##TODO use a non-bulk version of this? In general change/optimize this method for per-registration usage?
        programId,
        registrationStatus: RegistrationStatusEnum.completed,
        userId,
        messageContentDetails,
      },
    );
  }
}
