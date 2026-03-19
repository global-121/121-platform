import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import {
  MessageJobCustomDataDto,
  MessageProcessTypeExtension,
} from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class TransactionJobsHelperService {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly transactionRepository: TransactionRepository,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
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

  private async addMessageJobToQueue({
    registration,
    userId,
    message,
    messageTemplateKey,
    customData,
    bulksize,
  }: {
    registration: RegistrationEntity | Omit<RegistrationViewEntity, 'data'>;
    userId: number;
    message?: string;
    messageTemplateKey?: string;
    customData?: MessageJobCustomDataDto;
    bulksize?: number;
  }): Promise<void> {
    await this.queueMessageService.addMessageJob({
      registration,
      message,
      messageTemplateKey,
      messageContentType: MessageContentType.payment,
      messageProcessType:
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
      customData,
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
    let usedPlaceholders: string[] = [];
    try {
      usedPlaceholders =
        await this.queueMessageService.getPlaceholdersInMessageText(
          programId,
          undefined,
          type,
        );
    } catch {
      // If no template exists for this program/type, there are no placeholders to resolve
    }

    // amountTransferred is not a registration view attribute; handle it separately
    const registrationAttributePlaceholders = usedPlaceholders.filter(
      (p) => p !== 'amountTransferred',
    );

    const placeholderData: NonNullable<MessageJobCustomDataDto['placeholderData']> =
      {
        amountTransferred: String(amountTransferred),
      };

    if (registrationAttributePlaceholders.length > 0) {
      const registrationViews =
        await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
          {
            programId,
            referenceIds: [registration.referenceId],
            select: registrationAttributePlaceholders,
          },
        );
      const registrationView = registrationViews[0];
      if (registrationView) {
        for (const placeholder of registrationAttributePlaceholders) {
          placeholderData[placeholder] = registrationView[placeholder] ?? '';
        }
      }
    }

    await this.addMessageJobToQueue({
      registration,
      messageTemplateKey: type,
      customData: { placeholderData },
      bulksize: bulkSize,
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
    if (!isRetry) {
      await this.updatePaymentCountAndSetToCompleted({
        transactionId: context.transactionId,
        userId: context.userId!,
      });
    }

    await this.transactionsService.saveProgress({
      context,
      description: isRetry
        ? TransactionEventDescription.retry
        : TransactionEventDescription.initiated,
      newTransactionStatus: TransactionStatusEnum.waiting,
    });
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
      await this.transactionRepository.countTransactionsByReferenceId(
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
