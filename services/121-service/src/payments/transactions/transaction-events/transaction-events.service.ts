import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { TransactionEventsReturnDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-events-return.dto';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsMapper } from '@121-service/src/payments/transactions/transaction-events/mappers/transaction-events.mapper';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';

@Injectable()
export class TransactionEventsService {
  @InjectRepository(TransactionEventEntity)
  private readonly transactionEventRepository: Repository<TransactionEventEntity>;

  // ##TODO: move also to repository
  public async createEvent({
    context,
    type,
    description,
    errorMessage,
  }: {
    context: TransactionEventCreationContext;
    type: TransactionEventType;
    description: TransactionEventDescription;
    errorMessage?: string;
  }): Promise<void> {
    await this.transactionEventRepository.save({
      type,
      description,
      isSuccessfullyCompleted: !errorMessage,
      errorMessage,
      transactionId: context.transactionId,
      userId: context.userId,
      programFspConfigurationId: context.programFspConfigurationId,
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
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await this.transactionEventRepository
      .createQueryBuilder()
      .insert()
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

  public async getEventsByTransactionId(
    programId: number,
    transactionId: number,
  ): Promise<TransactionEventsReturnDto> {
    const transactionEventEntities = await this.transactionEventRepository.find(
      {
        where: {
          transaction: { payment: { programId: Equal(programId) } },
          transactionId: Equal(transactionId),
        },
        order: { created: 'ASC' },
        relations: { user: true },
      },
    );

    return TransactionEventsMapper.mapToTransactionEventsDto(
      transactionEventEntities,
    );
  }
}
