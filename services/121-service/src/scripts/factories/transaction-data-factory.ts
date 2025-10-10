import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Equal, Repository } from 'typeorm';

import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { BaseDataFactory } from '@121-service/src/scripts/factories/base-data-factory';

@Injectable()
export class TransactionDataFactory extends BaseDataFactory<TransactionEntity> {
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
      relations: { transactions: true },
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
          registration,
          registrationId: registration.id,
        });
      }
    }

    await this.insertEntitiesBatch(transactionsData);
    return;
  }

  public async createPaymentForProgram(
    programId: number,
  ): Promise<PaymentEntity> {
    console.log(`Creating payment for program ${programId}`);

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
    const initialPayment = await paymentRepo.findOne({
      where: { programId: Equal(programId) },
      order: { id: 'ASC' },
    });
    if (!initialPayment) {
      console.warn(`No initial payment found for program ${programId}`);
      return;
    }

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

  public async updateLatestTransactions(): Promise<void> {
    console.log('Updating latest transactions table');

    // Clear existing latest transactions
    await this.dataSource.query(
      'TRUNCATE TABLE "121-service"."latest_transaction"',
    );

    // Insert latest transactions using a more efficient query
    await this.dataSource.query(`
      INSERT INTO "121-service"."latest_transaction" ("paymentId", "registrationId", "transactionId")
      SELECT t."paymentId", t."registrationId", t.id AS transactionId
      FROM (
        SELECT "paymentId", "registrationId", MAX(id) AS max_id
        FROM "121-service"."transaction"
        WHERE status = 'success'
        GROUP BY "paymentId", "registrationId"
      ) AS latest_transactions
      INNER JOIN "121-service"."transaction" AS t
      ON t."paymentId" = latest_transactions."paymentId"
      AND t."registrationId" = latest_transactions."registrationId"
      AND t.id = latest_transactions.max_id;
    `);

    console.log('Latest transactions table updated successfully');
  }
}
