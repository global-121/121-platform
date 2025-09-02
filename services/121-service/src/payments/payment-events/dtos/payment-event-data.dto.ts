import { ApiProperty } from '@nestjs/swagger';

import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventAttributeKey } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';

export type PaymentEventAttributesDto = Partial<
  Record<PaymentEventAttributeKey, string | null>
>;

export class PaymentEventDataDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: PaymentEvent.note })
  public readonly type: string;

  @ApiProperty({ example: { id: 1, username: 'example@example.com' } })
  public readonly user?: { id: number; username: string } | null;

  @ApiProperty({ example: new Date() })
  public readonly created: Date;

  @ApiProperty({ example: { note: 'Payment note' } })
  public readonly attributes: PaymentEventAttributesDto;
}
