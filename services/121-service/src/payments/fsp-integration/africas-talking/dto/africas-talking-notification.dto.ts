import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class AfricasTalkingNotificationDto {
  @ApiModelProperty({ example: 'ATPid_1cbe5df027aca34ff15b885be975bfcd' })
  @IsString()
  public readonly transactionId: string;

  @ApiModelProperty({ example: 'MobileB2C' })
  @IsString()
  @IsIn(['MobileB2C'])
  public readonly category: string;

  @ApiModelProperty({ example: 'Athena' })
  @IsString()
  @IsIn(['Mpesa', 'Athena', 'Admin'])
  public readonly provider: string;

  @ApiModelProperty({ example: 'example' })
  @IsOptional()
  @IsString()
  public readonly providerRefId: string;

  @ApiModelProperty({ example: 'example' })
  @IsString()
  public readonly providerChannel: string;

  @ApiModelProperty({ example: 'example' })
  @IsOptional()
  @IsString()
  public readonly clientAccount: string;

  @ApiModelProperty({ example: 'test-product' })
  @IsString()
  public readonly productName: string;

  @ApiModelProperty({ example: 'Wallet' })
  @IsString()
  @IsIn(['PhoneNumber', 'BankAccount', 'Card', 'Wallet'])
  public readonly sourceType: string;

  @ApiModelProperty({ example: 'PaymentWallet' })
  @IsString()
  public readonly source: string;

  @ApiModelProperty({ example: 'PhoneNumber' })
  @IsString()
  @IsIn(['PhoneNumber', 'BankAccount', 'Card', 'Wallet'])
  public readonly destinationType: string;

  @ApiModelProperty({ example: '+254711123467' })
  @IsString()
  public readonly destination: string;

  @ApiModelProperty({ example: 'KES 10.00' })
  @IsString()
  public readonly value: string;

  @ApiModelProperty({ example: 'KES 0.10' })
  @IsOptional()
  @IsString()
  public readonly transactionFee: string;

  @ApiModelProperty({ example: 'KES 0.10' })
  @IsOptional()
  @IsString()
  public readonly providerFee: string;

  @ApiModelProperty({ example: 'Success' })
  @IsIn(['Success', 'Failed'])
  @IsString()
  public readonly status: string;

  @ApiModelProperty({ example: 'description' })
  @IsString()
  public readonly description: string;

  @ApiModelProperty({ example: {} })
  public readonly requestMetadata: JSON;

  @ApiModelProperty({ example: {} })
  public readonly providerMetadata: JSON;

  @ApiModelProperty({ example: '2020-09-02' })
  @IsOptional()
  @IsString()
  public readonly transactionDate: string;
}
