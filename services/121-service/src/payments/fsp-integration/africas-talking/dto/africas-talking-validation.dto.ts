import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class AfricasTalkingValidationDto {
  @ApiProperty({ example: 'ATPid_1cbe5df027aca34ff15b885be975bfcd' })
  @IsString()
  public readonly transactionId: string;

  @ApiProperty({ example: '+254711123467' })
  @IsString()
  public readonly phoneNumber: string;

  // This property is in API-documentation, but is not always included in payload in practice
  // @ApiProperty({ example: 'MobileB2C' })
  // @IsString()
  // public readonly category: string;

  @ApiProperty({ example: 'KES' })
  @IsString()
  public readonly currencyCode: string;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  public readonly amount: number;

  // This property is in API-documentation, but is not always included in payload in practice
  // @ApiProperty({ example: '212.78.193.200' })
  // @IsString()
  // public readonly sourceIpAddress: string;

  @ApiProperty({ example: { programId: '1', payment: '1' } })
  public readonly metadata: JSON;
}
