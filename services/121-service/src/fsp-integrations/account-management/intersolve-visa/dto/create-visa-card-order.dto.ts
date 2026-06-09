import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateVisaCardOrderDto {
  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  @Max(700)
  public readonly noOfCards: number;

  @ApiProperty({ example: 'Damrak' })
  @IsNotEmpty()
  @IsString()
  public readonly addressStreet: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsString()
  public readonly addressHouseNumber: string;

  @ApiProperty({ example: 'A', required: false })
  @IsOptional()
  @IsString()
  public readonly addressHouseNumberAddition?: string;

  @ApiProperty({ example: '1011AB' })
  @IsNotEmpty()
  @IsString()
  public readonly addressPostalCode: string;

  @ApiProperty({ example: 'Amsterdam' })
  @IsNotEmpty()
  @IsString()
  public readonly addressCity: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  public readonly addressee: string;

  @ApiProperty({
    example: '+31612345678',
    required: false,
    description:
      'Optional branch contact number for card order. Defaults to a system fallback when not provided.',
  })
  @IsOptional()
  @IsString()
  public readonly phoneNumber?: string;
}
