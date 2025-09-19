import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, IsNull, Not, Repository } from 'typeorm';

import { TransactionEventEntity } from '@121-service/src/payments/transactions/entities/transaction-event.entity';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';

@Injectable()
export class TransactionEventsService {
  // ##TODO scoped?
  @InjectRepository(TransactionEventEntity)
  private readonly transactionEventRepository: Repository<TransactionEventEntity>;

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
    description: string;
    userId: number | null; // null for system events
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

  // ##TODO: should this be in custom repository? Or in transaction-jobs-helper.service?
  public async countFailedTransactionAttempts(
    transactionId: number,
  ): Promise<number> {
    return this.transactionEventRepository.count({
      where: {
        transactionId: Equal(transactionId),
        errorMessage: Not(IsNull()),
        type: In([TransactionEventType.paymentProgress]),
      },
    });
  }
}
