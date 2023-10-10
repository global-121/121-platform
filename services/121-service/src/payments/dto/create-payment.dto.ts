import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly payment: number;
  @ApiProperty({ example: 10 })
  @IsNumber()
  public readonly amount: number;
}
