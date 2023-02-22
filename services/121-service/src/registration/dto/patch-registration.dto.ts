import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class PatchRegistrationDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  @IsOptional()
  @Length(2, 6)
  public readonly preferredLanguage: string;
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsOptional()
  public readonly paymentAmountMultiplier: number;
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsOptional()
  public readonly maxPayments: number;
}
