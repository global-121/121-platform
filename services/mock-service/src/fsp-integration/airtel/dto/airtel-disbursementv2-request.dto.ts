import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';

class AirtelDisbursementV2RequestPayeeDto {
  @ApiProperty({ example: 'ZMW' })
  public currency: string;
  @ApiProperty({ example: '123456789' })
  public msisdn: string;
  @ApiProperty({ example: '123456789' })
  public name: string;
}

class AirtelDisbursementV2RequestTransactionDto {
  @ApiProperty({ example: 0.1 })
  public amount: number;
  @ApiProperty({ example: uuid() })
  public id: string;
  @ApiProperty({ example: 'B2C' })
  public type: string;
}

export class AirtelDisbursementV2RequestDto {
  @ApiProperty()
  public payee: AirtelDisbursementV2RequestPayeeDto;
  @ApiProperty({ example: uuid() })
  public reference: string;
  @ApiProperty({ example: 'not-really-encrypted' })
  public pin: string;
  @ApiProperty()
  public transaction: AirtelDisbursementV2RequestTransactionDto;
}
