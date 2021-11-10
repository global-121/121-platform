import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';

export class BelcashPaymentStatusDto {
  @ApiModelProperty({ example: '123456' })
  @IsString()
  public readonly from: string;

  @ApiModelProperty({ example: 'Account name' })
  @IsString()
  public readonly fromname: string;

  @ApiModelProperty({ example: '123456' })
  @IsString()
  public readonly fromaccount: string;

  @ApiModelProperty({ example: '+251900000000' })
  @IsString()
  public readonly to: string;

  @ApiModelProperty({ example: 'example' })
  @IsString()
  public readonly toname: string;

  @ApiModelProperty({ example: 'example' })
  @IsString()
  public readonly toaccount: string;

  @ApiModelProperty({ example: 25 })
  @IsNumber()
  public readonly amount: number;

  @ApiModelProperty({ example: 5 })
  @IsNumber()
  public readonly fee: number;

  @ApiModelProperty({ example: 'ETB' })
  @IsString()
  public readonly currency: string;

  @ApiModelProperty({ example: '121 program: payment 1' })
  @IsString()
  public readonly description: string;

  @ApiModelProperty({ example: 'REGULAR_TRANSFER' })
  @IsString()
  public readonly statusdetail: string;

  @ApiModelProperty({ example: 'LUC000000520482ETH' })
  @IsString()
  @IsOptional()
  public readonly id: string;

  @ApiModelProperty({ example: '2021-11-09T11:20:27Z' })
  @IsString()
  @IsOptional()
  public readonly date: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  public readonly processdate: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  public readonly statuscomment: string;

  @ApiModelProperty({ example: 'AUTHORIZING' })
  @IsString()
  public readonly status: string;

  @ApiModelProperty({
    example: 'ed15b1f7-c579-4a59-8224-56520cd3bdf7-payment-1-1636456825275',
  })
  @IsString()
  @IsOptional()
  public readonly referenceid: string;

  @ApiModelProperty({
    example: 'ed15b1f7-c579-4a59-8224-56520cd3bdf7-payment-1-1636456825275',
  })
  @IsString()
  @IsOptional()
  public readonly tracenumber: string;

  @ApiModelProperty({ example: 'Lucy' })
  @IsString()
  public readonly system: string;
}
