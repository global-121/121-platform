import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { LastTransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/last-transaction-event.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';
import { isSameAsString } from '@121-service/src/utils/comparison.helper';

export class LastTransactionEventRepository extends Repository<LastTransactionEventEntity> {
  constructor(
    @InjectRepository(LastTransactionEventEntity)
    private baseRepository: Repository<LastTransactionEventEntity>,
  ) {
    super(
      baseRepository.target,
      baseRepository.manager,
      baseRepository.queryRunner,
    );
  }

  public async insertOrUpdateFromTransactionEvent(
    transactionEvent: TransactionEventEntity,
  ): Promise<void> {
    const lastTransactionEvent =
      new LastTransactionEventEntity() as QueryDeepPartialEntity<LastTransactionEventEntity>;
    lastTransactionEvent.transactionId = transactionEvent.transactionId;
    lastTransactionEvent.transactionEventId = transactionEvent.id;
    try {
      // Try to insert a new LastTransactionEventEntity
      await this.baseRepository.insert(lastTransactionEvent);
    } catch (error) {
      if (isSameAsString(error.code, PostgresStatusCodes.UNIQUE_VIOLATION)) {
        // If a unique constraint violation occurred, update the existing LastTransactionEventEntity
        await this.baseRepository.update(
          {
            transactionId: lastTransactionEvent.transactionId ?? undefined,
          },
          lastTransactionEvent,
        );
      } else {
        // If some other error occurred, rethrow it
        throw error;
      }
    }
  }

  public async bulkInsertFromTransactions(
    lastTransactionEventsToSave: {
      transactionId: number;
      transactionEventId: number;
    }[],
  ): Promise<void> {
    if (lastTransactionEventsToSave.length > 0) {
      await this.baseRepository
        .createQueryBuilder()
        .insert()
        .values(lastTransactionEventsToSave)
        .execute();
    }
  }
}
