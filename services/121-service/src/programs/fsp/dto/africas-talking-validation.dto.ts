import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class AfricasTalkingValidationDto {
  @ApiModelProperty({ example: 'SomeTransactionID' })
  @IsString()
  public readonly transactionId: string;

  @ApiModelProperty({ example: '+254711XXXYYY' })
  @IsString()
  public readonly phoneNumber: string;

  @ApiModelProperty({ example: 'KES' })
  @IsString()
  public readonly currencyCode: string;

  @ApiModelProperty({ example: 500.0 })
  @IsNumber()
  public readonly amount: number;

  @ApiModelProperty({ example: '12.34.56.78' })
  @IsString()
  public readonly sourceIpAddress: string;

  @ApiModelProperty({ example: { shopId: '1234', itemId: 'abcdef' } })
  public readonly metadata: JSON;
}
