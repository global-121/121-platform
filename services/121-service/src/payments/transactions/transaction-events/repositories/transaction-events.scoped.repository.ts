import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
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
