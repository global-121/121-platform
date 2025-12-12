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
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

@Injectable()
export class TransactionJobsHelperService {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
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

    await this.addMessageJobToQueue({
      registration,
      message: messageContent ?? undefined,
      bulksize: bulkSize,
      userId,
    });
  }

  /**
   * Saves the progress of a transaction and updates the registration accordingly.
   *
   * This method performs two main actions:
   * 1. If transaction of type 'initiated': it updates the payment count for the registration
   *    and sets its status to completed if applicable.
   * 2. It saves the transaction progress using the provided context, description, error message,
   *    and optionally a new transaction status.
   */
  public async saveTransactionProgress({
    context,
    description,
    newTransactionStatus,
    errorMessage,
  }: {
    context: TransactionEventCreationContext;
    description: TransactionEventDescription;
    newTransactionStatus?: TransactionStatusEnum;
    errorMessage?: string;
  }): Promise<void> {
    if (description === TransactionEventDescription.initiated) {
      await this.updatePaymentCountAndSetToCompleted({
        transactionId: context.transactionId,
        userId: context.userId!,
      });
    }

    await this.transactionsService.saveProgress({
      context,
      description,
      errorMessage,
      newTransactionStatus,
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
      referenceId: referenceId!,
      paymentCount: newPaymentCount,
    });

    await this.setStatusToCompletedIfApplicable({
      referenceId: referenceId!,
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
