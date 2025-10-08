import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Equal, In, Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { BaseDataFactory } from '@121-service/src/scripts/factories/base-data-factory';

export interface PaymentFactoryOptions {
  readonly programIds: number[]; // Changed from single programId to array
  readonly defaultUserId?: number; // Default user ID for transactions
}

interface TransactionFactoryOptions {
  readonly paymentId: number;
  readonly registrationId: number;
  readonly programFspConfigurationId: number;
  readonly userId?: number;
  readonly transferValue?: number;
  readonly status?: string;
}

@Injectable()
export class TransactionDataFactory extends BaseDataFactory<TransactionEntity> {
  private readonly paymentRepository: Repository<PaymentEntity>;

  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(TransactionEntity));
    this.paymentRepository = dataSource.getRepository(PaymentEntity);
  }

  /**
   * Create payment for a program (replaces mock-create-payment.sql)
   */
  public async createPaymentForProgram(
    programId: number,
  ): Promise<PaymentEntity> {
    console.log(`Creating payment for program ${programId}`);

    const paymentData: DeepPartial<PaymentEntity> = {
      programId,
    };

    return await this.paymentRepository.save(paymentData);
  }

  /**
   * Get the max payment ID (replaces mock-get-max-payment-id.sql)
   */
  public async getMaxPaymentId(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .select('MAX(payment.id)', 'id')
      .getRawOne();

    return result?.id || 0;
  }

  /**
   * Create transactions for a payment (replaces mock-payment-transactions.sql)
   */
  public async createTransactionsForPayment(
    paymentId: number,
    programId: number,
    options: Partial<TransactionFactoryOptions> = {},
  ): Promise<TransactionEntity[]> {
    console.log(
      `Creating transactions for payment ${paymentId} in program ${programId}`,
    );

    // Get registrations for this program
    const registrationRepository =
      this.dataSource.getRepository(RegistrationEntity);
    const registrations = await registrationRepository.find({
      where: { programId: Equal(programId) },
      select: ['id', 'programFspConfigurationId'],
    });

    if (registrations.length === 0) {
      console.warn(`No registrations found for program ${programId}`);
      return [];
    }

    // Fetch existing (registrationId, paymentId) pairs
    const transactionRepo = this.dataSource.getRepository(TransactionEntity);
    const existing = await transactionRepo.find({
      where: { paymentId: Equal(paymentId) },
      select: ['registrationId'],
    });
    const existingPairs = new Set(existing.map((t) => t.registrationId));

    const transactionsData: DeepPartial<TransactionEntity>[] = registrations
      .filter((registration) => !existingPairs.has(registration.id))
      .map((registration) => ({
        paymentId,
        registrationId: registration.id,
        programFspConfigurationId:
          registration.programFspConfigurationId ||
          options.programFspConfigurationId ||
          1,
        userId: options.userId || 1, // Provide fallback userId
        transferValue: options.transferValue || 100,
        status: options.status || 'success',
        transactionStep: 1,
        customData: {},
        errorMessage: null,
      }));

    const entities = this.createEntitiesBatch(transactionsData);
    return entities;
  }

  /**
   * Create transactions for one registration per existing registration for a specific program
   */
  public async createTransactionsOnePerRegistrationForProgram(
    programId: number,
    options: Partial<TransactionFactoryOptions> = {},
  ): Promise<TransactionEntity[]> {
    // Get all existing registrations for this specific program
    const registrationRepository =
      this.dataSource.getRepository(RegistrationEntity);
    const registrations = await registrationRepository.find({
      where: { programId: Equal(programId) },
      relations: { transactions: true },
    });

    if (registrations.length === 0) {
      console.warn(`No registrations found for program ${programId}`);
      return [];
    }

    // Get all payment IDs for this program
    const paymentRepo = this.dataSource.getRepository(PaymentEntity);
    const payments = await paymentRepo.find({
      where: { programId: Equal(programId) },
    });
    const paymentIds = payments.map((p) => p.id);

    // Fetch existing (registrationId, paymentId) pairs
    const transactionRepo = this.dataSource.getRepository(TransactionEntity);
    let existing: { registrationId: number; paymentId: number }[] = [];
    if (paymentIds.length === 1) {
      existing = await transactionRepo.find({
        where: { paymentId: Equal(paymentIds[0]) },
        select: ['registrationId', 'paymentId'],
      });
    } else if (paymentIds.length > 1) {
      existing = await transactionRepo.find({
        where: { paymentId: In(paymentIds) },
        select: ['registrationId', 'paymentId'],
      });
    }
    const existingPairs = new Set(
      existing.map((t) => `${t.registrationId}-${t.paymentId}`),
    );

    const transactionsData: DeepPartial<TransactionEntity>[] = registrations
      .map((registration) => {
        const paymentId = registrations.find((r) => r.transactions.length > 0)
          ?.transactions[0]?.paymentId;
        const pairKey = `${registration.id}-${paymentId}`;
        if (existingPairs.has(pairKey)) {
          return null;
        }
        return {
          paymentId,
          registrationId: registration.id,
          programFspConfigurationId:
            registration.programFspConfigurationId ||
            options.programFspConfigurationId ||
            1,
          userId: options.userId || 1, // Provide fallback userId
          transferValue: options.transferValue || 100,
          status: options.status || 'success',
          transactionStep: 1,
          customData: {},
          errorMessage: null,
        };
      })
      .filter(Boolean) as DeepPartial<TransactionEntity>[];

    const entities = this.createEntitiesBatch(transactionsData);
    return entities;
  }

  /**
   * Replicate transaction events for all transactions and update last-transaction-event
   */
  public async replicateTransactionEvents(programId: number): Promise<void> {
    const transactionRepo = this.dataSource.getRepository('TransactionEntity');
    const eventRepo = this.dataSource.getRepository('TransactionEventEntity');

    // Find the initial seeded transaction and its events
    const initialTransaction = await transactionRepo.findOne({
      where: { payment: { programId: Equal(programId) } },
      order: { id: 'ASC' },
      relations: { payment: true },
    });
    if (!initialTransaction) {
      console.warn('No initial transaction found for event replication');
      return;
    }
    const initialEvents = await eventRepo.find({
      where: { transaction: Equal(initialTransaction.id) },
    });

    // Find all transactions (for all payments)
    const allTransactions = await transactionRepo.find();
    for (const transaction of allTransactions) {
      if (transaction.id === initialTransaction.id) {
        continue; // Skip the initial transaction
      }

      // Replicate each event for this transaction as a new entity
      for (const event of initialEvents) {
        // Omit id and transaction, copy all other properties
        const { id: _id, transaction: _omit, ...eventData } = event;
        await eventRepo.save({
          ...eventData,
          transaction,
        });
      }
    }
  }

  /**
   * Update payment count for registrations (replaces mock-update-payment-count.sql)
   */
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

  /**
   * Update last transaction event table (replaces mock-last-transaction-event.sql)
   */
  public async updateLastTransactionEvents(): Promise<void> {
    console.log('Updating last transaction event table');

    // Clear existing last transaction events
    await this.dataSource.query(
      'TRUNCATE TABLE "121-service"."last_transaction_event"',
    );

    // Insert latest transactions using a more efficient query
    await this.dataSource.query(`
          INSERT INTO "121-service"."last_transaction_event" ("transactionId", "transactionEventId")
            SELECT "transactionId", MAX(id) AS "transactionEventId"
            FROM "121-service"."transaction_event"
            GROUP BY "transactionId"
        `);

    console.log('Last transaction event table updated successfully');
  }
}
