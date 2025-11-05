import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { LastTransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/last-transaction-event.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';

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

  public async updateOrInsertFromTransactionEvent(
    transactionEvent: TransactionEventEntity,
  ): Promise<void> {
    const lastTransactionEvent =
      new LastTransactionEventEntity() as QueryDeepPartialEntity<LastTransactionEventEntity>;
    lastTransactionEvent.transactionId = transactionEvent.transactionId;
    lastTransactionEvent.transactionEventId = transactionEvent.id;

    const updateResult = await this.baseRepository.update(
      { transactionId: lastTransactionEvent.transactionId ?? undefined },
      lastTransactionEvent,
    );

    if ((updateResult.affected ?? 0) === 0) {
      // No rows were updated, so insert a new record
      await this.baseRepository.insert(lastTransactionEvent);
    }
  }

  public async bulkUpdateFromTransactionEvents(
    transactionEvents: TransactionEventEntity[],
  ): Promise<void> {
    if (transactionEvents.length === 0) {
      return;
    }

    const values: QueryDeepPartialEntity<LastTransactionEventEntity>[] =
      transactionEvents.map((transactionEvent) => ({
        transactionId: transactionEvent.transactionId,
        transactionEventId: transactionEvent.id,
      }));

    const CHUNK_SIZE = 1000;
    for (let start = 0; start < values.length; start += CHUNK_SIZE) {
      const chunk = values.slice(start, start + CHUNK_SIZE);
      await this.baseRepository
        .createQueryBuilder()
        .insert()
        .into(LastTransactionEventEntity)
        .values(chunk)
        .orUpdate(['transactionEventId', 'updated'], ['transactionId'])
        .execute();
    }
  }
}
