import {
  PaymentEventAttributesDto,
  PaymentEventReturnDto,
} from '@121-service/src/payments/payment-events/dtos/payment-event-return.dto';
import { PaymentEventEntity } from '@121-service/src/payments/payment-events/entities/payment-event.entity';

export class PaymentEventsMapper {
  static mapToReturnDto(
    paymentEventEntities: PaymentEventEntity[],
  ): PaymentEventReturnDto[] {
    return paymentEventEntities.map((event) => ({
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
      attributes: PaymentEventsMapper.mapAttributes(event),
    }));
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
