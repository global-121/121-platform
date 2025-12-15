import { TransactionEventsReturnDto } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-events-return.dto';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import {
  mapEventsToDto,
  mapUserToDto,
} from '@121-service/src/utils/event-mapper/event.mapper.helper';

export const SYSTEM_USER = {
  id: 0,
  username: '121 system',
};

export class TransactionEventsMapper {
  public static mapToTransactionEventsDto(
    transactionEventEntities: TransactionEventEntity[],
  ): TransactionEventsReturnDto {
    return mapEventsToDto(
      transactionEventEntities,
      (event) => ({
        id: event.id,
        created: event.created,
        user: mapUserToDto(event.user) ?? SYSTEM_USER,
        description: event.description,
        isSuccessfullyCompleted: event.isSuccessfullyCompleted,
        errorMessage: event.errorMessage,
        programFspConfigurationId: event.programFspConfigurationId,
      }),
      (event) => event.description,
    );
  }
}
