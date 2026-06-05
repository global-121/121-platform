import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class MtnPayeeDto {
  @ApiProperty({ example: 'MSISDN' })
  @IsNotEmpty()
  @IsString()
  public readonly partyIdType: string;

  @ApiProperty({ example: '26878342874' })
  @IsNotEmpty()
  @IsString()
  public readonly partyId: string;
}

export class MtnCreateTransferRequestDto {
  @ApiProperty({ example: '140' })
  @IsNotEmpty()
  @IsString()
  public readonly amount: string;

  @ApiProperty({ example: 'EUR' })
  @IsNotEmpty()
  @IsString()
  public readonly currency: string;

  @ApiProperty({ example: 'CTOMPAY212268VFR' })
  @IsNotEmpty()
  @IsString()
  public readonly externalId: string;

  @ApiProperty({ type: MtnPayeeDto })
  @ValidateNested()
  @Type(() => MtnPayeeDto)
  public readonly payee: MtnPayeeDto;

  @ApiProperty({ example: 'Payment from account to MoMo Account' })
  @IsNotEmpty()
  @IsString()
  public readonly payerMessage: string;

  @ApiProperty({ example: 'Payment from account to MoMo Account' })
  @IsNotEmpty()
  @IsString()
  public readonly payeeNote: string;
}
