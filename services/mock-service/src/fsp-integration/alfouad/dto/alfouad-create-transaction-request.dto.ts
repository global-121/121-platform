import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AlfouadCreateTransactionRequestDto {
  @ApiProperty({ example: 'Red Crescent' })
  @IsNotEmpty()
  @IsString()
  public readonly SenderFullName: string;

  @ApiProperty({ example: '963900000000' })
  @IsNotEmpty()
  @IsString()
  public readonly SenderPhoneNumber: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  public readonly BeneficiaryFullName: string;

  @ApiProperty({ example: '963900000001' })
  @IsNotEmpty()
  @IsString()
  public readonly BeneficiaryPhoneNumber: string;

  @ApiProperty({ example: 'c7a4f6e0-0000-4000-8000-000000000001' })
  @IsNotEmpty()
  @IsString()
  public readonly ReferenceNumber: string;

  @ApiProperty({ example: 'SY' })
  @IsNotEmpty()
  @IsString()
  public readonly CountryCode: string;

  @ApiProperty({ example: 'Damascus' })
  @IsNotEmpty()
  @IsString()
  public readonly CityCode: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  public readonly AgentCode: number;

  @ApiProperty({ example: 'SYP' })
  @IsNotEmpty()
  @IsString()
  public readonly DeliveryCurrencyCode: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  public readonly DeliveryAmount: number;

  @ApiProperty({ example: 'redcrescent beneficiary' })
  @IsNotEmpty()
  @IsString()
  public readonly RelationShip: string;
}
