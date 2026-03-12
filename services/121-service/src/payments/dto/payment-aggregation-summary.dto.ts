import { ApiProperty } from '@nestjs/swagger';

import { AggregationsPerStatusDto } from '@121-service/src/payments/dto/aggregations-per-status.dto';

export class PaymentAggregationSummaryDto {
  @ApiProperty({ example: 1 })
  paymentId: number;

  @ApiProperty({ type: AggregationsPerStatusDto })
  aggregationsPerStatus: AggregationsPerStatusDto;

  @ApiProperty({ example: true })
  isPaymentApproved: boolean;

  @ApiProperty({ example: 2 })
  approvalsRequired: number;

  @ApiProperty({ example: 1 })
  approvalsGiven: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  paymentDate: Date;
}
