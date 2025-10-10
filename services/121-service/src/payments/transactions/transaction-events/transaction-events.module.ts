import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LastTransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/last-transaction-event.entity';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { LastTransactionEventRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/last-transaction-event.repository';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionEventsController } from '@121-service/src/payments/transactions/transaction-events/transaction-events.controller';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEventEntity,
      LastTransactionEventEntity,
    ]),
  ],
  providers: [
    TransactionEventsService,
    TransactionEventsScopedRepository,
    LastTransactionEventRepository,
  ],
  controllers: [TransactionEventsController],
  exports: [
    TransactionEventsService,
    TransactionEventsScopedRepository,
    LastTransactionEventRepository,
  ],
})
export class TransactionEventsModule {}
