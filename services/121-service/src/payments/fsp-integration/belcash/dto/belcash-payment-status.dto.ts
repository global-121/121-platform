import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BelcashPaymentStatusDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  public readonly from: string;

  @ApiProperty({ example: 'Account name' })
  @IsString()
  public readonly fromname: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  public readonly fromaccount: string;

  @ApiProperty({ example: '+251900000000' })
  @IsString()
  public readonly to: string;

  @ApiProperty({ example: 'example' })
  @IsString()
  public readonly toname: string;

  @ApiProperty({ example: 'example' })
  @IsString()
  public readonly toaccount: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  public readonly amount: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  public readonly fee: number;

  @ApiProperty({ example: 'ETB' })
  @IsString()
  public readonly currency: string;

  @ApiProperty({ example: '121 program: payment 1' })
  @IsString()
  public readonly description: string;

  @ApiProperty({ example: 'REGULAR_TRANSFER' })
  @IsString()
  public readonly statusdetail: string;

  @ApiProperty({ example: 'LUC000000520482ETH' })
  @IsString()
  @IsOptional()
  public readonly id: string;

  @ApiProperty({ example: '2021-11-09T11:20:27Z' })
  @IsString()
  @IsOptional()
  public readonly date: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly processdate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly statuscomment: string;

  @ApiProperty({ example: 'AUTHORIZING' })
  @IsString()
  public readonly status: string;

  @ApiProperty({
    example: 'ed15b1f7-c579-4a59-8224-56520cd3bdf7-payment-1-1636456825275',
  })
  @IsString()
  @IsOptional()
  public readonly referenceid: string;

  @ApiProperty({
    example: 'ed15b1f7-c579-4a59-8224-56520cd3bdf7-payment-1-1636456825275',
  })
  @IsString()
  @IsOptional()
  public readonly tracenumber: string;

  @ApiProperty({ example: 'Lucy' })
  @IsString()
  public readonly system: string;
}
