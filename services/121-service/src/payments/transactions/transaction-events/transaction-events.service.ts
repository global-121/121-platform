import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';

@Injectable()
export class TransactionEventsService {
  @InjectRepository(TransactionEventEntity)
  private readonly transactionEventRepository: Repository<TransactionEventEntity>;

  // ##TODO: move also to repository? Then no service needed any more?
  public async createEvent({
    transactionId,
    type,
    description,
    userId,
    programFspConfigurationId,
    errorMessage,
  }: {
    transactionId: number;
    type: TransactionEventType;
    description: TransactionEventDescription;
    userId: number | null; // null for e.g. callbacks
    programFspConfigurationId: number;
    errorMessage?: string;
  }): Promise<void> {
    await this.transactionEventRepository.save({
      type,
      description,
      isSuccessfullyCompleted: !errorMessage,
      errorMessage,
      transactionId,
      userId,
      programFspConfigurationId,
    });
  }
}
