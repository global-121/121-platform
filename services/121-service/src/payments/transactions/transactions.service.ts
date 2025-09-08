import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import chunk from 'lodash/chunk';
import { Equal, In, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { getFspSettingByNameOrThrow } from '@121-service/src/fsps/fsp-settings.helpers';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import {
  PaTransactionResultDto,
  TransactionNotificationObject,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
@Injectable()
export class TransactionsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(LatestTransactionEntity)
  private readonly latestTransactionRepository: Repository<LatestTransactionEntity>;

  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(
    private registrationUtilsService: RegistrationUtilsService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly queueMessageService: MessageQueuesService,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationEventsService: RegistrationEventsService,
  ) {}

  public async getLastTransactions({
    programId,
    paymentId,
    referenceId,
    status,
    programFspConfigId,
  }: {
    programId: number;
    paymentId?: number;
    referenceId?: string;
    status?: TransactionStatusEnum;
    programFspConfigId?: number;
  }): Promise<TransactionReturnDto[]> {
    return this.transactionScopedRepository
      .getLastTransactionsQuery({
        programId,
        paymentId,
        referenceId,
        status,
        programFspConfigId,
      })
      .getRawMany();
  }

  public async storeTransactionUpdateStatus(
    transactionResponse: PaTransactionResultDto,
    relationDetails: TransactionRelationDetailsDto,
    transactionStep?: number,
  ): Promise<TransactionEntity> {
    const program = await this.programRepository.findOneByOrFail({
      id: relationDetails.programId,
    });

    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(transactionResponse.referenceId) },
    });

    const transaction = new TransactionEntity();
    transaction.amount = transactionResponse.calculatedAmount;
    transaction.created = transactionResponse.date || new Date();
    transaction.registration = registration;
    transaction.programFspConfigurationId =
      relationDetails.programFspConfigurationId;
    transaction.paymentId = relationDetails.paymentId;
    transaction.userId = relationDetails.userId;
    transaction.status = transactionResponse.status;
    transaction.errorMessage = transactionResponse.message ?? null;
    transaction.customData = transactionResponse.customData;
    transaction.transactionStep = transactionStep || 1;

    const resultTransaction =
      await this.transactionScopedRepository.save(transaction);

    // TODO: What does this do? Was necessary for Intersolve Vouchers, but not here? Ruben probably knows.
    if (transactionResponse.messageSid) {
      await this.twilioMessageRepository.update(
        { sid: transactionResponse.messageSid },
        {
          transactionId: resultTransaction.id,
        },
      );
    }

    const notifyOnTransaction = getFspSettingByNameOrThrow(
      transactionResponse.fspName,
    ).notifyOnTransaction;

    await this.updatePaymentCountRegistration(
      registration,
      program.enableMaxPayments,
    );
    await this.updateLatestTransaction(transaction);
    if (
      transactionResponse.status === TransactionStatusEnum.success &&
      notifyOnTransaction &&
      transactionResponse.notificationObjects &&
      transactionResponse.notificationObjects.length > 0
    ) {
      // loop over notification objects and send a message for each
      for (const transactionNotification of transactionResponse.notificationObjects) {
        const message = await this.getMessageText(
          registration.preferredLanguage ?? undefined,
          program.id,
          transactionNotification,
        );
        await this.queueMessageService.addMessageJob({
          registration,
          message,
          messageContentType: MessageContentType.payment,
          messageProcessType:
            MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
          bulksize: transactionNotification.bulkSize,
          userId: relationDetails.userId,
        });
      }
    }
    return resultTransaction;
  }

  private async getMessageText(
    language: LanguageEnum = LanguageEnum.en,
    programId: number,
    transactionNotification: TransactionNotificationObject,
  ): Promise<string | undefined> {
    const key = transactionNotification.notificationKey;
    const messageTemplates =
      await this.messageTemplateService.getMessageTemplatesByProgramId(
        programId,
        key,
      );

    const notification = messageTemplates.find(
      (template) => template.language === language,
    );
    const fallbackNotification = messageTemplates.find(
      (template) => template.language === this.fallbackLanguage,
    );
    let message = notification
      ? notification.message
      : fallbackNotification?.message;

    if (transactionNotification?.dynamicContent?.length) {
      for (const [
        i,
        dynamicContent,
      ] of transactionNotification.dynamicContent.entries()) {
        const replaceString = `[[${i + 1}]]`;
        if (message?.includes(replaceString)) {
          message = message.replace(replaceString, dynamicContent);
        }
      }
    }
    return message ?? undefined;
  }

  private async updateLatestTransaction(
    transaction: TransactionEntity,
  ): Promise<void> {
    const latestTransaction =
      new LatestTransactionEntity() as QueryDeepPartialEntity<LatestTransactionEntity>;
    latestTransaction.registrationId = transaction.registrationId;
    latestTransaction.paymentId = transaction.paymentId;
    latestTransaction.transactionId = transaction.id;
    try {
      // Try to insert a new LatestTransactionEntity
      await this.latestTransactionRepository.insert(latestTransaction);
    } catch (error) {
      if (error.code === '23505') {
        // 23505 is the code for unique violation in PostgreSQL
        // If a unique constraint violation occurred, update the existing LatestTransactionEntity
        await this.latestTransactionRepository.update(
          {
            registrationId: latestTransaction.registrationId ?? undefined,
            paymentId: latestTransaction.paymentId ?? undefined,
          },
          latestTransaction,
        );
      } else {
        // If some other error occurred, rethrow it
        throw error;
      }
    }
  }

  private async updatePaymentCountRegistration(
    registration: RegistrationEntity,
    enableMaxPayments: boolean,
  ): Promise<void> {
    // Get current amount of payments done to PA
    const { currentPaymentCount } = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('COUNT(DISTINCT "paymentId")', 'currentPaymentCount')
      .leftJoin('transaction.registration', 'r')
      .leftJoin('transaction.payment', 'p')
      .andWhere('p."programId" = :programId', {
        programId: registration.programId,
      })
      .andWhere('r.id = :registrationId', {
        registrationId: registration.id,
      })
      .getRawOne();
    // Match that against registration.maxPayments
    // If a program has a maxPayments set, and the currentPaymentCount is equal or larger to that, set registrationStatus to completed if it is currently included
    if (
      enableMaxPayments &&
      registration.maxPayments &&
      currentPaymentCount >= registration.maxPayments &&
      registration.registrationStatus === RegistrationStatusEnum.included
    ) {
      const registrationsBeforeUpdate = { ...registration };
      registration.registrationStatus = RegistrationStatusEnum.completed;
      const registrationsAfterUpdate =
        await this.registrationUtilsService.save(registration);
      await this.registrationEventsService.createFromRegistrationViews(
        {
          id: registrationsBeforeUpdate.id,
          status: registrationsBeforeUpdate.registrationStatus ?? undefined,
        },
        {
          id: registrationsAfterUpdate.id,
          status: registrationsAfterUpdate.registrationStatus ?? undefined,
        },
        {
          explicitRegistrationPropertyNames: ['status'],
        },
      );
    }
    // After .save() because it otherwise overwrites with old paymentCount
    await this.registrationScopedRepository.updateUnscoped(registration.id, {
      paymentCount: currentPaymentCount,
    });
  }

  public async storeReconciliationTransactionsBulk(
    transactionResults: PaTransactionResultDto[],
    transactionRelationDetails: TransactionRelationDetailsDto,
  ): Promise<void> {
    // NOTE: this method is currently only used for the import-excel-reconciliation use case and assumes:
    // 1: only 1 program fsp id
    // 2: no notifications to send
    // 3: no payment count to update (as it is reconciliation of existing payment)
    // 4: no twilio message to relate to

    const transactionsToSave = await Promise.all(
      transactionResults.map(async (transactionResponse) => {
        // Get registrationId from referenceId if it is not defined
        // TODO find out when this is needed it seems to make more sense if the registrationId is always known and than refenceId is not needed
        if (!transactionResponse.registrationId) {
          const registration =
            await this.registrationScopedRepository.findOneOrFail({
              where: { referenceId: Equal(transactionResponse.referenceId) },
            });
          transactionResponse.registrationId = registration.id;
        }

        const transaction = new TransactionEntity();
        transaction.amount = transactionResponse.calculatedAmount;
        transaction.registrationId = transactionResponse.registrationId;
        transaction.programFspConfigurationId =
          transactionRelationDetails.programFspConfigurationId;
        transaction.paymentId = transactionRelationDetails.paymentId;
        transaction.userId = transactionRelationDetails.userId;
        transaction.status = transactionResponse.status;
        transaction.errorMessage = transactionResponse.message ?? null;
        transaction.customData = transactionResponse.customData;
        transaction.transactionStep = 1;
        // set other properties as needed
        return transaction;
      }),
    );

    const BATCH_SIZE = 2500;
    const transactionChunks = chunk(transactionsToSave, BATCH_SIZE);

    for (const chunkedTransactions of transactionChunks) {
      const savedTransactions =
        await this.transactionScopedRepository.save(chunkedTransactions);
      const savedTransactionEntities =
        await this.transactionScopedRepository.find({
          where: {
            id: In(savedTransactions.map((i) => i.id)),
          },
        });

      // Leaving this per transaction for now, as it is not a performance bottleneck
      for (const transaction of savedTransactionEntities) {
        await this.updateLatestTransaction(transaction);
      }
    }
  }

  public async updateWaitingTransaction(
    paymentId: number,
    regisrationId: number,
    status: TransactionStatusEnum,
    transactionStep: number,
    messageSid?: string,
    errorMessage?: string,
  ): Promise<void> {
    const foundTransaction = await this.transactionScopedRepository.findOne({
      where: {
        paymentId: Equal(paymentId),
        registrationId: Equal(regisrationId),
        transactionStep: Equal(transactionStep),
        status: Equal(TransactionStatusEnum.waiting),
      },
    });
    if (foundTransaction) {
      if (status === TransactionStatusEnum.waiting && messageSid) {
        await this.twilioMessageRepository.update(
          { sid: messageSid },
          {
            transactionId: foundTransaction.id,
          },
        );
      }
      if (status === TransactionStatusEnum.error) {
        foundTransaction.status = status;
        foundTransaction.errorMessage = errorMessage ?? null;
        await this.transactionScopedRepository.save(foundTransaction);
      }
    }
  }
}
