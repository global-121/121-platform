import { ApiProperty } from '@nestjs/swagger';

import { PaymentEventAttributeKey } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';

export type PaymentEventAttributesDto = Partial<
  Record<PaymentEventAttributeKey, string | null>
>;

export class TransactionEventDataDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: TransactionEventType.created })
  public readonly type: TransactionEventType;

  @ApiProperty({ example: { id: 1, username: 'example@example.com' } })
  public readonly user?: { id: number; username: string } | null;

  @ApiProperty({ example: new Date() })
  public readonly created: Date;

  @ApiProperty({ example: TransactionEventDescription.created })
  public readonly description: TransactionEventDescription;

  @ApiProperty({ example: true })
  public readonly isSuccessfullyCompleted: boolean;

  @ApiProperty({ example: null })
  public readonly errorMessage?: string | null;

  @ApiProperty({ example: 1 })
  public readonly programFspConfigurationId: number;
}
