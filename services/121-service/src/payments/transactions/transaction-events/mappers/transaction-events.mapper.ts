import { TransactionEventDataDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-event-data.dto';
import { TransactionEventsReturnDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-events-return.dto';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';

export class TransactionEventsMapper {
  // TODO: shared code with payment-events.mapper.ts and maybe activities endpoint. Move to shared location?
  public static mapToTransactionEventsDto(
    transactionEventEntities: TransactionEventEntity[],
  ): TransactionEventsReturnDto {
    const data = this.mapEntitiesToEventData(transactionEventEntities);
    const count = this.getCountByType(transactionEventEntities);
    const total = transactionEventEntities.length;

    return {
      meta: {
        count,
        total,
      },
      data,
    };
  }

  private static mapEntitiesToEventData(
    transactionEventEntities: TransactionEventEntity[],
  ): TransactionEventDataDto[] {
    return transactionEventEntities.map((event) => ({
      id: event.id,
      type: event.type,
      created: event.created,
      user:
        event.user?.id && event.user?.username
          ? {
              id: event.user.id,
              username: event.user.username,
            }
          : null,
      description: event.description,
      isSuccessfullyCompleted: event.isSuccessfullyCompleted, //##TODO: Do we need this?
      errorMessage: event.errorMessage,
      programFspConfigurationId: event.programFspConfigurationId, //##TODO: probably need fspConfig name also here?
    }));
  }

  private static getCountByType(
    transactionEventEntities: TransactionEventEntity[],
  ): Partial<Record<TransactionEventType, number>> {
    const count: Partial<Record<TransactionEventType, number>> = {};

    transactionEventEntities.forEach((event) => {
      count[event.type] = (count[event.type] ?? 0) + 1;
    });

    return count;
  }
}
