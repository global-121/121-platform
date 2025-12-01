import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventAttributeKey } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';

export type PaymentEventAttributes = Partial<
  Record<PaymentEventAttributeKey, string | null>
>;

export interface PaymentEventInterface {
  readonly id: number;
  readonly type: PaymentEvent;
  readonly user?: { id: number; username: string } | null;
  readonly created: Date;
  readonly attributes: PaymentEventAttributes;
}
