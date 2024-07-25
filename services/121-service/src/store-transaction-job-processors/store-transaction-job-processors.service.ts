import { UnitOfWork } from '@121-service/src/database/unit-of-work.service';
import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { Inject, Injectable } from '@nestjs/common';

import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis-client';

import {
  ProcessNameStoreTransaction,
  QueueNameStoreTransaction,
} from '@121-service/src/payments/enum/queue.names.enum';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Redis from 'ioredis';

export interface StoreTransactionJob {
  amount: number;
  registration: RegistrationEntity;
  financialServiceProviderId: number;
  programId: number;
  paymentNumber: number;
  userId: number;
  status: StatusEnum;
  storeOnlyTransaction?: boolean;
  isRetry?: boolean;
  errorMessage?: string;
  isTransactionSuccess: boolean;
}

@Injectable()
export class StoreTransactionJobProcessorsService {
  public constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    @InjectQueue(QueueNameStoreTransaction.storeTransactionIntersolveVisa)
    private readonly storeTransactionIntersolveVisaQueue: Queue,
    private readonly programRepository: ProgramRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async addStoreTransactionJobToQueue(
    storeTransactionJob: StoreTransactionJob,
  ): Promise<void> {
    try {
      const job = await this.storeTransactionIntersolveVisaQueue.add(
        ProcessNameStoreTransaction.storeTransaction,
        storeTransactionJob,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    } catch (error) {
      console.warn('Error in addStoreTransactionJobToQueue: ', error);
    }
  }

  public async processIntersolveVisaStoreTransactionJob(
    storeTransactionJobData: StoreTransactionJob,
  ): Promise<void> {
    if (storeTransactionJobData.isTransactionSuccess) {
      await this.handleTransactionSuccess(storeTransactionJobData);
    } else {
      await this.handleTransactionFailure(storeTransactionJobData);
    }
  }

  private async handleTransactionSuccess(
    storeTransactionJobData: StoreTransactionJob,
  ): Promise<void> {
    // Start a new unit of work to handle the transaction
    await this.unitOfWork.execute(async () => {
      // Get the database transaction manager from the unit of work
      const manager = this.unitOfWork.getManager();

      // Create a TransactionEntity with the provided details
      const transaction = await this.getTransactionEntity({
        amount: storeTransactionJobData.amount,
        registration: storeTransactionJobData.registration,
        financialServiceProviderId:
          storeTransactionJobData.financialServiceProviderId,
        programId: storeTransactionJobData.programId,
        paymentNumber: storeTransactionJobData.paymentNumber,
        userId: storeTransactionJobData.userId,
        status: StatusEnum.success,
      });

      // Save the transaction entity first to get its id
      const savedTransaction = await manager.save(
        TransactionEntity,
        transaction,
      );

      if (!storeTransactionJobData.storeOnlyTransaction) {
        // Create LatestTransactionEntity to store the latest transaction details
        const latestTransaction = new LatestTransactionEntity();
        latestTransaction.registrationId = savedTransaction.registrationId;
        latestTransaction.payment = savedTransaction.payment;
        latestTransaction.transactionId = savedTransaction.id;

        // Save the latest transaction entity
        await manager.save(LatestTransactionEntity, latestTransaction);

        // If the transaction is not a retry, update the payment count and status in the registration entity
        if (!storeTransactionJobData.isRetry) {
          const updatedRegistration =
            await this.getRegistrationEntityWithUpdatedPaymentCountAndStatus(
              storeTransactionJobData.registration,
              storeTransactionJobData.programId,
            );

          // Save the updated registration entity
          await manager.save(RegistrationEntity, updatedRegistration);
        }
      }
    });
  }

  private async handleTransactionFailure(
    storeTransactionJobData: StoreTransactionJob,
  ): Promise<void> {
    // Start a new unit of work to handle the transaction failure
    await this.unitOfWork.execute(async () => {
      // Get the database transaction manager from the unit of work
      const manager = this.unitOfWork.getManager();

      // Create TransactionEntity with the provided details, marking the status as error
      const transaction = await this.getTransactionEntity({
        amount: storeTransactionJobData.amount,
        registration: storeTransactionJobData.registration,
        financialServiceProviderId:
          storeTransactionJobData.financialServiceProviderId,
        programId: storeTransactionJobData.programId,
        paymentNumber: storeTransactionJobData.paymentNumber,
        userId: storeTransactionJobData.userId,
        status: StatusEnum.error,
        errorMessage: storeTransactionJobData.errorMessage,
      });

      // Save the transaction entity first to get its id
      const savedTransaction = await manager.save(
        TransactionEntity,
        transaction,
      );

      if (!storeTransactionJobData.storeOnlyTransaction) {
        // Create LatestTransactionEntity to store the latest transaction details
        const latestTransaction = new LatestTransactionEntity();
        latestTransaction.registrationId = savedTransaction.registrationId;
        latestTransaction.payment = savedTransaction.payment;
        latestTransaction.transactionId = savedTransaction.id;

        // Save the latest transaction entity
        await manager.save(LatestTransactionEntity, latestTransaction);

        // Update the registration entity's payment count and status
        const updatedRegistration =
          await this.getRegistrationEntityWithUpdatedPaymentCountAndStatus(
            storeTransactionJobData.registration,
            storeTransactionJobData.programId,
          );

        // Update the registration entity
        await manager.save(RegistrationEntity, updatedRegistration);
      }
    });
  }

  private async getTransactionEntity({
    amount,
    registration,
    financialServiceProviderId,
    programId,
    paymentNumber,
    userId,
    status,
    errorMessage,
  }: {
    amount: number;
    registration: RegistrationEntity;
    financialServiceProviderId: number;
    programId: number;
    paymentNumber: number;
    userId: number;
    status: StatusEnum;
    errorMessage?: string;
  }): Promise<TransactionEntity> {
    const transaction = new TransactionEntity();
    transaction.amount = amount;
    transaction.registration = registration;
    transaction.financialServiceProviderId = financialServiceProviderId;
    transaction.programId = programId;
    transaction.payment = paymentNumber;
    transaction.userId = userId;
    transaction.status = status;
    transaction.transactionStep = 1;
    transaction.errorMessage = errorMessage ?? null;
    transaction.created = new Date();

    return transaction;
  }

  private async getRegistrationEntityWithUpdatedPaymentCountAndStatus(
    registration: RegistrationEntity,
    programId: number,
  ): Promise<RegistrationEntity> {
    const program = await this.programRepository.findByIdOrFail(programId);
    // TODO: Implement retry attempts for the paymentCount and status update.
    // See old code for counting the transactions
    // See if failed transactions also lead to status 'Completed' and is retryable
    registration.paymentCount = (registration.paymentCount || 0) + 1;

    if (
      program.enableMaxPayments &&
      registration.maxPayments &&
      registration.paymentCount >= registration.maxPayments
    ) {
      registration.registrationStatus = RegistrationStatusEnum.completed;
    }

    return registration;
  }
}
