import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class PayeeDto {
  @ApiProperty({ example: 'MSISDN' })
  @IsNotEmpty()
  @IsString()
  public readonly partyIdType: string;

  @ApiProperty({ example: '26878342874' })
  @IsNotEmpty()
  @IsString()
  public readonly partyId: string;
}

export class CreateTransferDto {
  @ApiProperty({ example: '3d767552-bca7-40d9-97f7-8216eb5126c2' })
  @IsNotEmpty()
  @IsString()
  public readonly referenceId: string;

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

  @ApiProperty({ type: PayeeDto })
  @ValidateNested()
  @Type(() => PayeeDto)
  public readonly payee: PayeeDto;

  @ApiProperty({
    example: 'Payment from account to MoMo Account',
  })
  @IsNotEmpty()
  @IsString()
  public readonly payerMessage: string;

  @ApiProperty({
    example: 'Payment from account to MoMo Account',
  })
  @IsNotEmpty()
  @IsString()
  public readonly payeeNote: string;
}
