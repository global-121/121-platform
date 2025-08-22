import { ApiProperty } from '@nestjs/swagger';

import { PaymentEventEnum } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventAttributeKeyEnum } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';

export type PaymentEventAttributesDto = Partial<
  Record<PaymentEventAttributeKeyEnum, string | null>
>;

export class PaymentEventReturnDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: PaymentEventEnum.note })
  public readonly type: string;

  @ApiProperty({ example: { id: 1, username: 'admin@example.org' } })
  public readonly user?: { id: number; username: string } | null;

  @ApiProperty({ example: new Date() })
  public readonly created: Date;

  @ApiProperty({ example: { note: 'Payment note' } })
  public readonly attributes: PaymentEventAttributesDto;
}
