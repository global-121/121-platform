import {
  PaymentEventAttributesDto,
  PaymentEventDataDto,
} from '@121-service/src/payments/payment-events/dtos/payment-event-data.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentEventEntity } from '@121-service/src/payments/payment-events/entities/payment-event.entity';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';

export class PaymentEventsMapper {
  public static mapToPaymentEventsDto(
    paymentEventEntities: PaymentEventEntity[],
  ): PaymentEventsReturnDto {
    const data = this.mapEntitiesToEventData(paymentEventEntities);
    const count = this.getCountByType(paymentEventEntities);
    const total = paymentEventEntities.length;

    return {
      meta: {
        count,
        total,
      },
      data,
    };
  }

  private static mapEntitiesToEventData(
    paymentEventEntities: PaymentEventEntity[],
  ): PaymentEventDataDto[] {
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

  private static getCountByType(
    paymentEventEntities: PaymentEventEntity[],
  ): Partial<Record<PaymentEvent, number>> {
    const count: Partial<Record<PaymentEvent, number>> = {};

    paymentEventEntities.forEach((event) => {
      count[event.type] = (count[event.type] ?? 0) + 1;
    });

    return count;
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
