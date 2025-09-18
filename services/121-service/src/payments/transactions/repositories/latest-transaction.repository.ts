import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { LatestTransactionEntity } from '@121-service/src/payments/transactions/latest-transaction.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { isSameStatus } from '@121-service/src/utils/comparison.helper';

export class LatestTransactionRepository extends Repository<LatestTransactionEntity> {
  constructor(
    @InjectRepository(LatestTransactionEntity)
    private baseRepository: Repository<LatestTransactionEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async insertOrUpdateFromTransaction(
    transaction: TransactionEntity,
  ): Promise<void> {
    const latestTransaction =
      new LatestTransactionEntity() as QueryDeepPartialEntity<LatestTransactionEntity>;
    latestTransaction.registrationId = transaction.registrationId;
    latestTransaction.paymentId = transaction.paymentId;
    latestTransaction.transactionId = transaction.id;
    try {
      // Try to insert a new LatestTransactionEntity
      await this.baseRepository.insert(latestTransaction);
    } catch (error) {
      if (
        isSameStatus(
          error.code,
          '23505', // 23505 is the error code for unique_violation (see: https://www.postgresql.org/docs/current/errcodes-appendix.html)
        )
      ) {
        // If a unique constraint violation occurred, update the existing LatestTransactionEntity
        await this.baseRepository.update(
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

  public async getPaymentCount(registrationId: number): Promise<number> {
    const distinctPayments = await this.baseRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.payment')
      .where('transaction.registrationId = :registrationId', { registrationId })
      .getRawMany();

    return distinctPayments.length;
  }
}
