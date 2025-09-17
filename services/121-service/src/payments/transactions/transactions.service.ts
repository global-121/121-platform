import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import chunk from 'lodash/chunk';
import { Equal, In, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/entities/latest-transaction.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';
import { isSameAsString } from '@121-service/src/utils/comparison.helper';
@Injectable()
export class TransactionsService {
  @InjectRepository(LatestTransactionEntity)
  private readonly latestTransactionRepository: Repository<LatestTransactionEntity>;

  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
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

  public async storeTransactionForStep2({
    transactionResponse,
    relationDetails,
  }: {
    transactionResponse: PaTransactionResultDto;
    relationDetails: TransactionRelationDetailsDto;
  }): Promise<void> {
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
    transaction.transactionStep = 2;

    const resultTransaction =
      await this.transactionScopedRepository.save(transaction);

    if (transactionResponse.messageSid) {
      await this.twilioMessageRepository.update(
        { sid: transactionResponse.messageSid },
        {
          transactionId: resultTransaction.id,
        },
      );
    }
    await this.updateLatestTransaction(transaction);
    // Transaction step 2 does not need to update payment count or send notification
    // As transaction step 1 already did that
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
      if (isSameAsString(error.code, PostgresStatusCodes.UNIQUE_VIOLATION)) {
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
        // TODO find out when this is needed it seems to make more sense if the registrationId is always known and than referenceId is not needed
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

  public async updateWaitingTransactionStep1(
    paymentId: number,
    registrationId: number,
    status: TransactionStatusEnum,
    messageSid?: string,
    errorMessage?: string,
  ): Promise<void> {
    const foundTransaction = await this.transactionScopedRepository.findOne({
      where: {
        paymentId: Equal(paymentId),
        registrationId: Equal(registrationId),
        transactionStep: Equal(1),
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
