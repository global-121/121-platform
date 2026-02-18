import { ApiProperty } from '@nestjs/swagger';

class CountAndTransferValueDto {
  @ApiProperty({ example: 0 })
  count: number;

  @ApiProperty({ example: 0 })
  transferValue: number;
}

export class PaymentAggregationSummaryDto {
  @ApiProperty({ example: 1 })
  paymentId: number;

  @ApiProperty({
    example: { count: 0, transferValue: 0 },
    type: CountAndTransferValueDto,
  })
  success: CountAndTransferValueDto;

  @ApiProperty({
    example: { count: 0, transferValue: 0 },
    type: CountAndTransferValueDto,
  })
  waiting: CountAndTransferValueDto;

  @ApiProperty({
    example: { count: 3, transferValue: 75 },
    type: CountAndTransferValueDto,
  })
  failed: CountAndTransferValueDto;

  @ApiProperty({
    example: { count: 0, transferValue: 0 },
    type: CountAndTransferValueDto,
  })
  pendingApproval: CountAndTransferValueDto;

  @ApiProperty({
    example: { count: 0, transferValue: 0 },
    type: CountAndTransferValueDto,
  })
  approved: CountAndTransferValueDto;

  @ApiProperty({ example: true })
  isPaymentApproved: boolean;

  @ApiProperty({ example: 2 })
  approvalsRequired: number;

  @ApiProperty({ example: 1 })
  approvalsGiven: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  paymentDate: Date;
}
