import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/transaction-events.scoped.repository';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEventEntity])],
  providers: [TransactionEventsService, TransactionEventsScopedRepository],
  exports: [TransactionEventsService],
})
export class TransactionEventsModule {}
