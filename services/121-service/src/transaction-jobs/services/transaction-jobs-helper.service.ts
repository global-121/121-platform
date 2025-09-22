import { Injectable } from '@nestjs/common';

import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

@Injectable()
export class TransactionJobsHelperService {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionEventsService: TransactionEventsService,
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

  public async createTransactionEvent({
    transactionJob,
    transactionEventType,
    description,
    errorMessage,
  }: {
    transactionJob: SharedTransactionJobDto;
    transactionEventType: TransactionEventType;
    description: TransactionEventDescription;
    errorMessage?: string;
    transactionStatus?: TransactionStatusEnum;
  }) {
    await this.transactionEventsService.createEvent({
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      type: transactionEventType,
      description,
      errorMessage,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
    });
  }

  public async updateTransactionStatus(
    transactionId: number,
    status: TransactionStatusEnum,
  ) {
    await this.transactionScopedRepository.update(transactionId, { status });
  }

  public async createInitiatedOrRetryTransactionEvent(
    transactionJob: SharedTransactionJobDto,
  ) {
    await this.createTransactionEvent({
      transactionJob,
      transactionEventType: transactionJob.isRetry
        ? TransactionEventType.retry
        : TransactionEventType.initiated,
      description: transactionJob.isRetry
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
}
