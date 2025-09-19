import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TransactionEventEntity } from '@121-service/src/payments/transactions/entities/transaction-event.entity';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';

@Injectable()
export class TransactionEventsService {
  @InjectRepository(TransactionEventEntity)
  private readonly transactionEventRepository: Repository<TransactionEventEntity>;

  public async createEvent({
    transactionId,
    type,
    userId,
    programFspConfigurationId,
    errorMessage,
  }: {
    transactionId: number;
    type: TransactionEventType;
    userId: number | null; // null for system events
    programFspConfigurationId: number;
    errorMessage?: string;
  }): Promise<void> {
    await this.transactionEventRepository.save({
      type,
      transactionId,
      userId,
      programFspConfigurationId,
      errorMessage,
    });
  }
}
