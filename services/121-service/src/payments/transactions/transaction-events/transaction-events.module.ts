import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';
import { TransactionEventsController } from '@121-service/src/payments/transactions/transaction-events/transaction-events.controller';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/transaction-events.scoped.repository';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEventEntity])],
  providers: [TransactionEventsService, TransactionEventsScopedRepository],
  controllers: [TransactionEventsController],
  exports: [TransactionEventsService, TransactionEventsScopedRepository],
})
export class TransactionEventsModule {}
