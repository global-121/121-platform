import { ApiProperty } from '@nestjs/swagger';

class CountAmountDto {
  @ApiProperty({ example: 0 })
  count: number;

  @ApiProperty({ example: 0 })
  amount: number;
}

export class PaymentReturnDto {
  @ApiProperty({ example: { count: 0, amount: 0 }, type: CountAmountDto })
  success: CountAmountDto;

  @ApiProperty({ example: { count: 0, amount: 0 }, type: CountAmountDto })
  waiting: CountAmountDto;

  @ApiProperty({ example: { count: 3, amount: 75 }, type: CountAmountDto })
  failed: CountAmountDto;
}
