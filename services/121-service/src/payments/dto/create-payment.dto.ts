import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  public readonly amount?: number;

  @ApiProperty({
    example: 'Extra payment to registrations not included in first payment',
  })
  @IsString()
  @IsOptional()
  public readonly note?: string;
}
