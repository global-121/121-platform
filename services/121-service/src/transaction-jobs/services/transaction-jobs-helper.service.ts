import { Injectable } from '@nestjs/common';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

interface ProcessTransactionResultInput {
  registration: RegistrationEntity;
  transactionJob: SharedTransactionJobDto;
  transferAmountInMajorUnit: number;
  status: TransactionStatusEnum;
  errorText?: string;
  customData?: Record<string, unknown>;
}

@Injectable()
export class TransactionJobsHelperService {
  public constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly latestTransactionRepository: LatestTransactionRepository,
    private readonly programRepository: ProgramRepository,
    private readonly registrationEventsService: RegistrationEventsService,
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

  public async createTransactionAndUpdateRegistration({
    registration,
    transactionJob,
    transferAmountInMajorUnit: calculatedTransferAmountInMajorUnit,
    status,
    errorText: errorMessage,
    customData,
  }: ProcessTransactionResultInput): Promise<TransactionEntity> {
    const { programFspConfigurationId, programId, paymentId, userId, isRetry } =
      transactionJob;

    const resultTransaction = await this.createTransaction({
      amount: calculatedTransferAmountInMajorUnit,
      registration,
      programFspConfigurationId,
      paymentId,
      userId,
      status,
      errorMessage,
      customData,
    });

    await this.latestTransactionRepository.insertOrUpdateFromTransaction(
      resultTransaction,
    );

    if (!isRetry) {
      const paymentCount = await this.updateAndGetPaymentCount(registration.id);
      const currentStatusIsCompleted =
        await this.setStatusToCompleteIfApplicable({
          registration,
          programId,
          paymentCount,
        });

      // Added this check to avoid a bit of processing time if the status is the same
      if (currentStatusIsCompleted) {
        await this.registrationEventsService.createFromRegistrationViews(
          {
            id: registration.id,
            status: registration.registrationStatus ?? undefined,
          },
          {
            id: registration.id,
            status: RegistrationStatusEnum.completed,
          },
          {
            explicitRegistrationPropertyNames: ['status'],
          },
        );
      }
    }

    return resultTransaction;
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

  private async createTransaction({
    amount, // transaction entity are always in major unit
    registration,
    programFspConfigurationId,
    paymentId,
    userId,
    status,
    errorMessage,
    customData,
  }: {
    amount: number;
    registration: RegistrationEntity;
    programFspConfigurationId: number;
    paymentId: number;
    userId: number;
    status: TransactionStatusEnum;
    errorMessage?: string;
    customData?: Record<string, unknown>;
  }) {
    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.created = new Date();
    transaction.registration = registration;
    transaction.programFspConfigurationId = programFspConfigurationId;
    transaction.paymentId = paymentId;
    transaction.userId = userId;
    transaction.status = status;
    transaction.transactionStep = 1;
    transaction.errorMessage = errorMessage ?? null;
    transaction.customData = customData ?? {};

    return await this.transactionScopedRepository.save(transaction);
  }

  private async updateAndGetPaymentCount(
    registrationId: number,
  ): Promise<number> {
    const paymentCount =
      await this.latestTransactionRepository.getPaymentCount(registrationId);

    await this.registrationScopedRepository.updateUnscoped(registrationId, {
      paymentCount,
    });
    return paymentCount;
  }

  private async setStatusToCompleteIfApplicable({
    registration,
    programId,
    paymentCount,
  }: {
    registration: RegistrationEntity;
    programId: number;
    paymentCount: number;
  }): Promise<boolean> {
    const program = await this.programRepository.findByIdOrFail(programId);

    if (!program.enableMaxPayments) {
      return false;
    }

    // registration.maxPayments can only be a positive integer or null
    // This situation will only occur when enableMaxPayments is turned on after
    // the registration was created.
    if (
      registration.maxPayments === null ||
      registration.maxPayments === undefined
    ) {
      return false;
    }

    if (paymentCount < registration.maxPayments) {
      return false;
    }

    await this.registrationScopedRepository.updateUnscoped(registration.id, {
      registrationStatus: RegistrationStatusEnum.completed,
    });

    return true;
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
