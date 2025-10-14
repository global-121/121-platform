import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { TransactionEventsReturnDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-events-return.dto';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsMapper } from '@121-service/src/payments/transactions/transaction-events/mappers/transaction-events.mapper';
import { LastTransactionEventRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/last-transaction-event.repository';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';

@Injectable()
export class TransactionEventsService {
  constructor(
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
    private readonly lastTransactionEventRepository: LastTransactionEventRepository,
  ) {}

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
    const transactionEvent = this.transactionEventScopedRepository.create({
      type,
      description,
      isSuccessfullyCompleted: !errorMessage,
      errorMessage,
      transactionId: context.transactionId,
      userId: context.userId,
      programFspConfigurationId: context.programFspConfigurationId,
    });

    const resultTransactionEvent =
      await this.transactionEventScopedRepository.save(transactionEvent);

    await this.lastTransactionEventRepository.updateOrInsertFromTransactionEvent(
      resultTransactionEvent,
    );
  }

  public async getEventsByTransactionId(
    programId: number,
    transactionId: number,
  ): Promise<TransactionEventsReturnDto> {
    const transactionEventEntities =
      await this.transactionEventScopedRepository.find({
        where: {
          transaction: { payment: { programId: Equal(programId) } },
          transactionId: Equal(transactionId),
        },
        order: { created: 'ASC' },
        relations: { user: true },
      });

    return TransactionEventsMapper.mapToTransactionEventsDto(
      transactionEventEntities,
    );
  }

  public async createEventsBulk({
    transactionIds,
    programFspConfigurationId,
    userId,
    type,
    description,
    isSuccessfullyCompleted,
    errorMessage,
  }: {
    transactionIds: number[];
    programFspConfigurationId: number;
    userId: number;
    type: TransactionEventType;
    description: TransactionEventDescription;
    isSuccessfullyCompleted: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const transactionEvents = transactionIds.map((transactionId) =>
      this.transactionEventScopedRepository.create({
        transactionId,
        programFspConfigurationId,
        userId,
        type,
        description,
        isSuccessfullyCompleted,
        errorMessage,
      }),
    );

    await this.transactionEventScopedRepository.save(transactionEvents, {
      chunk: 1000,
    });
  }
}
