import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  public readonly amount?: number;
}
