import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Equal, Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { BaseDataFactory } from '@121-service/src/scripts/factories/base-data-factory';

export interface PaymentFactoryOptions {
  readonly programIds: number[]; // Changed from single programId to array
}

export interface TransactionFactoryOptions {
  readonly paymentId: number;
  readonly registrationId: number;
  readonly programFspConfigurationId: number;
  readonly userId?: number;
  readonly amount?: number;
  readonly status?: string;
}

@Injectable()
export class PaymentDataFactory extends BaseDataFactory<PaymentEntity> {
  private readonly transactionRepository: Repository<TransactionEntity>;

  constructor(dataSource: DataSource) {
    super(dataSource, dataSource.getRepository(PaymentEntity));
    this.transactionRepository = dataSource.getRepository(TransactionEntity);
  }

  /**
   * Generate mock payments
   */
  public async generateMockData(
    count: number,
    options: PaymentFactoryOptions,
  ): Promise<PaymentEntity[]> {
    console.log(
      `Generating ${count} mock payments for program ${options.programId}`,
    );

    const paymentsData: DeepPartial<PaymentEntity>[] = [];

    for (let i = 0; i < count; i++) {
      paymentsData.push({
        programId: options.programId,
      });
    }

    return await this.createEntitiesBatch(paymentsData);
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

    return await this.createEntity(paymentData);
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

    const transactionsData: DeepPartial<TransactionEntity>[] =
      registrations.map((registration) => ({
        paymentId,
        registrationId: registration.id,
        programFspConfigurationId:
          registration.programFspConfigurationId ||
          options.programFspConfigurationId ||
          1,
        userId: options.userId,
        amount: options.amount || 100,
        status: options.status || 'success',
        transactionStep: 1,
        customData: {},
        errorMessage: null,
      }));

    const entities = this.transactionRepository.create(transactionsData);
    return await this.transactionRepository.save(entities);
  }

  /**
   * Create transactions for one registration per existing registration for a specific program
   */
  public async createTransactionsOnePerRegistrationForProgram(
    paymentId: number,
    programId: number,
    options: Partial<TransactionFactoryOptions> = {},
  ): Promise<TransactionEntity[]> {
    console.log(
      `Creating one transaction per registration for payment ${paymentId} and program ${programId}`,
    );

    // Get all existing registrations for this specific program
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

    const transactionsData: DeepPartial<TransactionEntity>[] =
      registrations.map((registration) => ({
        paymentId,
        registrationId: registration.id,
        programFspConfigurationId:
          registration.programFspConfigurationId ||
          options.programFspConfigurationId ||
          1,
        userId: options.userId,
        amount: options.amount || 100,
        status: options.status || 'success',
        transactionStep: 1,
        customData: {},
        errorMessage: null,
      }));

    const entities = this.transactionRepository.create(transactionsData);
    return await this.transactionRepository.save(entities);
  }

  /**
   * Create transactions for one registration per existing registration (replaces mock-transactions-one-per-registration.sql)
   */
  public async createTransactionsOnePerRegistration(
    paymentId: number,
    options: Partial<TransactionFactoryOptions> = {},
  ): Promise<TransactionEntity[]> {
    console.log(
      `Creating one transaction per registration for payment ${paymentId}`,
    );

    // Get all existing registrations
    const registrationRepository =
      this.dataSource.getRepository(RegistrationEntity);
    const registrations = await registrationRepository.find({
      select: ['id', 'programFspConfigurationId'],
    });

    if (registrations.length === 0) {
      console.warn('No registrations found');
      return [];
    }

    const transactionsData: DeepPartial<TransactionEntity>[] =
      registrations.map((registration) => ({
        paymentId,
        registrationId: registration.id,
        programFspConfigurationId:
          registration.programFspConfigurationId ||
          options.programFspConfigurationId ||
          1,
        userId: options.userId,
        amount: options.amount || 100,
        status: options.status || 'success',
        transactionStep: 1,
        customData: {},
        errorMessage: null,
      }));

    const entities = this.transactionRepository.create(transactionsData);
    return await this.transactionRepository.save(entities);
  }

  /**
   * Update payment count for registrations (replaces mock-update-payment-count.sql)
   */
  public async updatePaymentCounts(): Promise<void> {
    console.log('Updating payment counts for registrations');

    // Use a more efficient query to update payment counts
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
   * Update latest transactions table (replaces mock-latest-transactions.sql)
   */
  public async updateLatestTransactions(): Promise<void> {
    console.log('Updating latest transactions table');

    // Clear existing latest transactions
    await this.dataSource.query(
      'TRUNCATE TABLE "121-service"."latest_transaction"',
    );

    // Insert latest transactions using a more efficient query
    await this.dataSource.query(`
      INSERT INTO "121-service"."latest_transaction" ("registrationId", "transactionId", "paymentId")
      SELECT DISTINCT ON ("registrationId") 
        "registrationId", 
        "id" as "transactionId",
        "paymentId"
      FROM "121-service"."transaction"
      WHERE "registrationId" IS NOT NULL
      ORDER BY "registrationId", "created" DESC
    `);

    console.log('Latest transactions table updated successfully');
  }
}
