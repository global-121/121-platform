import { TransactionEventsReturnDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-events-return.dto';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/transaction-event.entity';
import {
  mapEventsToDto,
  mapUserToDto,
} from '@121-service/src/utils/event-mapper/event.mapper.helper';

export class TransactionEventsMapper {
  public static mapToTransactionEventsDto(
    transactionEventEntities: TransactionEventEntity[],
  ): TransactionEventsReturnDto {
    return mapEventsToDto(
      transactionEventEntities,
      (event) => ({
        id: event.id,
        type: event.type,
        created: event.created,
        user: mapUserToDto(event.user),
        description: event.description,
        isSuccessfullyCompleted: event.isSuccessfullyCompleted,
        errorMessage: event.errorMessage,
        programFspConfigurationId: event.programFspConfigurationId,
      }),
      (event) => event.type,
    );
  }
}
