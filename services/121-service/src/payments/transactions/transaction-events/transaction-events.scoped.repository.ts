import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class TransactionEventsScopedRepository extends ScopedRepository<TransactionEventEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(TransactionEventEntity)
    repository: Repository<TransactionEventEntity>,
  ) {
    super(request, repository);
  }

  public async countFailedTransactionAttempts(
    transactionId: number,
  ): Promise<number> {
    return this.count({
      where: {
        transactionId: Equal(transactionId),
        type: In([TransactionEventType.processingStep]),
        isSuccessfullyCompleted: Equal(false),
      },
    });
  }
  public async findLatestEventByTransactionId(
    transactionId: number,
  ): Promise<TransactionEventEntity> {
    return this.findOneOrFail({
      where: { transactionId: Equal(transactionId) },
      order: { created: 'DESC' },
    });
  }
}
