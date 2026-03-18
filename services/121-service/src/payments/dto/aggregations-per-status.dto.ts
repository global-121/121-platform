import { ApiProperty } from '@nestjs/swagger';

class CountAndTransferValueDto {
  @ApiProperty({ example: 0 })
  count: number;

  @ApiProperty({ example: 0 })
  transferValue: number;
}

/**
 * Aggregated payment statistics grouped by payment status.
 *
 * Provides a summary view of payment distributions across different states
 * in a program's payment cycle.
 */
export class AggregationsPerStatusDto {
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
}
