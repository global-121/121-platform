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
}
