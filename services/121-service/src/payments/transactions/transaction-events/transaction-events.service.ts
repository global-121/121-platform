import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

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

  public async createEventsBulk(
    items: {
      transactionId: number;
      userId: number;
      type: TransactionEventType;
      description: TransactionEventDescription;
      programFspConfigurationId: number;
      errorMessage?: string | null;
    }[],
    manager?: EntityManager,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }
    const repo = manager
      ? manager.getRepository(TransactionEventEntity)
      : this.transactionEventRepository;
    await repo
      .createQueryBuilder()
      .insert()
      .into(TransactionEventEntity)
      .values(
        items.map((i) => ({
          transactionId: i.transactionId,
          userId: i.userId,
          type: i.type,
          description: i.description,
          programFspConfigurationId: i.programFspConfigurationId,
          errorMessage: i.errorMessage ?? null,
          isSuccessfullyCompleted: !i.errorMessage,
        })),
      )
      .execute();
  }
}
