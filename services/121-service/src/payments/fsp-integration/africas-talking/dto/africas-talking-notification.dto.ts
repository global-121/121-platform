import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class AfricasTalkingNotificationDto {
  @ApiProperty({ example: 'ATPid_1cbe5df027aca34ff15b885be975bfcd' })
  @IsString()
  public readonly transactionId: string;

  @ApiProperty({ example: 'MobileB2C' })
  @IsString()
  @IsIn(['MobileB2C'])
  public readonly category: string;

  @ApiProperty({ example: 'Athena' })
  @IsString()
  @IsIn(['Mpesa', 'Athena', 'Admin'])
  public readonly provider: string;

  @ApiProperty({ example: 'example' })
  @IsOptional()
  @IsString()
  public readonly providerRefId: string;

  @ApiProperty({ example: 'example' })
  @IsString()
  public readonly providerChannel: string;

  @ApiProperty({ example: 'example' })
  @IsOptional()
  @IsString()
  public readonly clientAccount: string;

  @ApiProperty({ example: 'test-product' })
  @IsString()
  public readonly productName: string;

  @ApiProperty({ example: 'Wallet' })
  @IsString()
  @IsIn(['PhoneNumber', 'BankAccount', 'Card', 'Wallet'])
  public readonly sourceType: string;

  @ApiProperty({ example: 'PaymentWallet' })
  @IsString()
  public readonly source: string;

  @ApiProperty({ example: 'PhoneNumber' })
  @IsString()
  @IsIn(['PhoneNumber', 'BankAccount', 'Card', 'Wallet'])
  public readonly destinationType: string;

  @ApiProperty({ example: '+254711123467' })
  @IsString()
  public readonly destination: string;

  @ApiProperty({ example: 'KES 10.00' })
  @IsString()
  public readonly value: string;

  @ApiProperty({ example: 'KES 0.10' })
  @IsOptional()
  @IsString()
  public readonly transactionFee: string;

  @ApiProperty({ example: 'KES 0.10' })
  @IsOptional()
  @IsString()
  public readonly providerFee: string;

  @ApiProperty({ example: 'Success' })
  @IsIn(['Success', 'Failed'])
  @IsString()
  public readonly status: string;

  @ApiProperty({ example: 'description' })
  @IsString()
  public readonly description: string;

  @ApiProperty({ example: {} })
  public readonly requestMetadata: JSON;

  @ApiProperty({ example: {} })
  public readonly providerMetadata: JSON;

  @ApiProperty({ example: '2020-09-02' })
  @IsOptional()
  @IsString()
  public readonly transactionDate: string;
}
