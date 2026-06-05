import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class MtnApiPayeeDto {
  @ApiProperty({ description: 'Type of party identifier', example: 'MSISDN' })
  @IsString()
  @IsNotEmpty()
  public readonly partyIdType: string;

  @ApiProperty({ description: 'Party identifier value (e.g. phone number)' })
  @IsString()
  @IsNotEmpty()
  public readonly partyId: string;
}

export class MtnApiCreateTransferRequestBodyDto {
  @ApiProperty({ description: 'Transfer amount' })
  @IsString()
  @IsNotEmpty()
  public readonly amount: string;

  @ApiProperty({ description: 'Currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  public readonly currency: string;

  @ApiProperty({ description: 'External identifier for the transaction' })
  @IsString()
  @IsNotEmpty()
  public readonly externalId: string;

  @ApiProperty({ description: 'Payee information' })
  @ValidateNested()
  @Type(() => MtnApiPayeeDto)
  public readonly payee: MtnApiPayeeDto;

  @ApiProperty({ description: 'Message to the payer' })
  @IsString()
  public readonly payerMessage: string;

  @ApiProperty({ description: 'Note to the payee' })
  @IsString()
  public readonly payeeNote: string;
}
