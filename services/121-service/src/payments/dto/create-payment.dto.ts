import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'Payment 1' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  public readonly name: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  public readonly transferValue?: number;

  @ApiProperty({
    example: 'Extra payment to registrations not included in first payment',
  })
  @IsString()
  @IsOptional()
  public readonly note?: string;
}
