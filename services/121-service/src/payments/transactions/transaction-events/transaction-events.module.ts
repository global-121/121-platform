import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionEventEntity } from '@121-service/src/payments/transactions/entities/transaction-event.entity';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEventEntity])],
  providers: [TransactionEventsService],
  exports: [TransactionEventsService],
})
export class TransactionEventsModule {}
