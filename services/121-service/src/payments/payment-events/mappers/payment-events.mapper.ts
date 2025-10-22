import { PaymentEventAttributesDto } from '@121-service/src/payments/payment-events/dtos/payment-event-data.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentEventEntity } from '@121-service/src/payments/payment-events/entities/payment-event.entity';
import {
  mapEventsToDto,
  mapUserToDto,
} from '@121-service/src/utils/event-mapper/event.mapper.helper';

export class PaymentEventsMapper {
  public static mapToPaymentEventsDto(
    paymentEventEntities: PaymentEventEntity[],
  ): PaymentEventsReturnDto {
    return mapEventsToDto(
      paymentEventEntities,
      (event) => ({
        id: event.id,
        type: event.type,
        created: event.created,
        user: mapUserToDto(event.user),
        attributes: PaymentEventsMapper.mapAttributes(event),
      }),
      (event) => event.type,
    );
  }

  private static mapAttributes(
    event: PaymentEventEntity,
  ): PaymentEventAttributesDto {
    const attributes: PaymentEventAttributesDto = {};
    if (event.attributes && event.attributes.length > 0) {
      for (const attr of event.attributes) {
        attributes[attr.key] = attr.value;
      }
    }
    return attributes;
  }
}
