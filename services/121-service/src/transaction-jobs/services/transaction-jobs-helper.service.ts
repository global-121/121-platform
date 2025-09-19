import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
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

  public async createTransactionEventAndUpdateTransaction({
    registrationId,
    paymentId,
    userId,
    programFspConfigurationId,
    transactionEventType,
    description,
    errorMessage,
    transactionStatus,
  }: {
    registrationId: number;
    paymentId: number;
    userId: number;
    programFspConfigurationId: number;
    transactionEventType: TransactionEventType;
    description: string;
    errorMessage?: string;
    transactionStatus?: TransactionStatusEnum;
  }): Promise<number> {
    // get transaction
    // ##TODO is it possible to pass transactionId along already via the job instead of finding this via registrationId + paymentId?
    const transaction = await this.transactionScopedRepository.findOneOrFail({
      where: {
        registrationId: Equal(registrationId),
        paymentId: Equal(paymentId),
      },
    });

    // update transaction status - if provided
    if (transactionStatus) {
      await this.transactionScopedRepository.update(transaction.id, {
        status: transactionStatus,
      });
    }

    // create transaction event
    await this.transactionEventsService.createEvent({
      transactionId: transaction.id,
      type: transactionEventType,
      description,
      userId,
      errorMessage,
      programFspConfigurationId,
    });

    return transaction.id;
  }

  public async createInitiatedOrRetryTransactionEvent({
    registrationId,
    transactionJob,
  }: {
    registrationId: number;
    transactionJob: SharedTransactionJobDto;
  }): Promise<number> {
    return await this.createTransactionEventAndUpdateTransaction({
      registrationId,
      paymentId: transactionJob.paymentId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
      transactionEventType: transactionJob.isRetry
        ? TransactionEventType.retry
        : TransactionEventType.initiated,
      description: transactionJob.isRetry
        ? 'Onafriq transfer retry initiated'
        : 'Onafriq transfer initiated',
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
