import { Injectable } from '@nestjs/common';
import chunk from 'lodash/chunk';
import { DataSource, DeepPartial, Equal, Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { BaseSeedFactory } from '@121-service/src/scripts/factories/base-seed-factory';

@Injectable()
export class TransactionSeedFactory extends BaseSeedFactory<TransactionEntity> {
  private readonly paymentRepository: Repository<PaymentEntity>;

  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(TransactionEntity));
    this.paymentRepository = dataSource.getRepository(PaymentEntity);
  }

  public async extendTransactionsFirstPaymentToAllRegistrations(
    programId: number,
  ): Promise<void> {
    const registrationRepo = this.dataSource.getRepository(RegistrationEntity);
    const transactionRepo = this.dataSource.getRepository(TransactionEntity);

    const registrations = await registrationRepo.find({
      where: { programId: Equal(programId) },
    });
    console.log(
      `Generating messages for ${registrations.length} registrations`,
    );

    // Find the initial seeded registrations and its transactions
    const initialRegistration = registrations[0];
    const initialTransactions = await transactionRepo.find({
      where: { registration: Equal(initialRegistration.id) },
    });

    const transactionsData: DeepPartial<TransactionEntity>[] = [];
    for (const registration of registrations.filter(
      (r) => r.id !== initialRegistration.id, // Do not insert the initial registration's transactions again
    )) {
      // Replicate each transaction for this registration as a new entity
      for (const transaction of initialTransactions) {
        // Omit id and registration, copy all other properties
        const {
          id: _id,
          registration: _omit,
          ...transactionData
        } = transaction;
        transactionsData.push({
          ...transactionData,
          registrationId: registration.id,
        });
      }
    }

    await this.insertEntitiesBatch(transactionsData);
    return;
  }

  public async extendTransactionEventsToAllTransactions(
    programId: number,
  ): Promise<void> {
    const transactionRepo = this.dataSource.getRepository(TransactionEntity);
    const eventRepo = this.dataSource.getRepository(TransactionEventEntity);

    // Find the initial seeded transaction and its events
    const initialTransaction = await transactionRepo.findOne({
      where: { payment: { programId: Equal(programId) } },
      order: { id: 'ASC' },
    });
    if (!initialTransaction) {
      console.log(
        `No initial transaction found for program ${programId}, skipping extending transaction events.`,
      );
      return;
    }
    const initialEvents = await eventRepo.find({
      where: { transaction: Equal(initialTransaction.id) },
    });

    const findBatchSize = 100000;
    let offset = 0;
    let totalProcessed = 0;
    let hasMore = true;
    while (hasMore) {
      // Fetch a batch of transactions (excluding the initial one)
      const transactionBatch = await transactionRepo.find({
        where: { payment: { programId: Equal(programId) } },
        order: { id: 'ASC' },
        skip: offset,
        take: findBatchSize,
      });
      // Remove the initial transaction if present in the first batch
      const filteredBatch =
        offset === 0
          ? transactionBatch.filter((t) => t.id !== initialTransaction.id)
          : transactionBatch;
      if (filteredBatch.length === 0) {
        hasMore = false;
        break;
      }
      const eventsData: DeepPartial<TransactionEventEntity>[] = [];
      for (const transaction of filteredBatch) {
        for (const event of initialEvents) {
          const { id: _id, transaction: _omit, ...eventData } = event;
          eventsData.push({
            ...eventData,
            transactionId: transaction.id,
          });
        }
      }
      const insertBatchSize = 2500;
      for (const batch of chunk(eventsData, insertBatchSize)) {
        await eventRepo.insert(batch as any[]);
      }
      totalProcessed += filteredBatch.length;
      console.log(
        `Inserted event data for ${totalProcessed} transactions so far...`,
      );
      offset += findBatchSize;
    }
  }

  public async createPaymentForProgram(
    programId: number,
  ): Promise<PaymentEntity> {
    const paymentData: DeepPartial<PaymentEntity> = {
      programId,
    };
    return await this.paymentRepository.save(paymentData);
  }

  public async extendTransactionsForPayment(
    programId: number,
    paymentId: number,
  ): Promise<void> {
    const paymentRepo = this.dataSource.getRepository(PaymentEntity);
    const transactionRepo = this.dataSource.getRepository(TransactionEntity);

    // Find the initial payment and its transactions
    const initialPayment = await paymentRepo.findOneOrFail({
      where: { programId: Equal(programId) },
      order: { id: 'ASC' },
    });

    const initialTransactions = await transactionRepo.find({
      where: { payment: Equal(initialPayment.id) },
    });

    const transactionsData: DeepPartial<TransactionEntity>[] = [];
    // Replicate each transaction for this new payment as a new entity
    for (const transaction of initialTransactions) {
      // Omit id and payment, copy all other properties
      const { id: _id, payment: _omit, ...transactionData } = transaction;
      transactionsData.push({
        ...transactionData,
        paymentId,
      });
    }

    await this.insertEntitiesBatch(transactionsData);
  }

  public async updatePaymentCounts(): Promise<void> {
    console.log('Updating payment counts for registrations');

    await this.dataSource.query(`
      UPDATE "121-service"."registration"
      SET "paymentCount" = subquery.payment_count
      FROM (
        SELECT
          "registrationId",
          COUNT(DISTINCT "paymentId") as payment_count
        FROM "121-service"."transaction"
        GROUP BY "registrationId"
      ) AS subquery
      WHERE "121-service"."registration"."id" = subquery."registrationId"
    `);

    console.log('Payment counts updated successfully');
  }

  public async updateLastTransactionEvents(): Promise<void> {
    console.log('Updating last transaction events table');

    // Clear existing last transaction events
    await this.dataSource.query(
      'TRUNCATE TABLE "121-service"."last_transaction_event"',
    );

    const lastEvents = await this.dataSource
      .createQueryBuilder()
      .select('"transactionId"')
      .addSelect('MAX(id)', 'transactionEventId')
      .from('121-service.transaction_event', 'te')
      .groupBy('"transactionId"')
      .getRawMany();

    const BATCH_SIZE = 2500;
    for (const batch of chunk(lastEvents, BATCH_SIZE)) {
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('121-service.last_transaction_event')
        .values(
          batch.map((e) => ({
            transactionId: e.transactionId,
            transactionEventId: e.transactionEventId,
          })),
        )
        .execute();
    }

    console.log('Last transaction events table updated successfully');
  }
}
