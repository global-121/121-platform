import { ApiProperty } from '@nestjs/swagger';

class CountAndTransferValueDto {
  @ApiProperty({ example: 0 })
  count: number;

  @ApiProperty({ example: 0 })
  transferValue: number;
}

export class PaymentReturnDto {
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
  created: CountAndTransferValueDto;
}
