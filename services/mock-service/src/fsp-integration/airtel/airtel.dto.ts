import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';

export class AirtelAuthenticateBodyDto {
  @ApiProperty({ example: uuid() })
  public client_id: string;
  @ApiProperty({ example: uuid() })
  public client_secret: string;
  @ApiProperty({ example: 'client_credentials' })
  public grant_type: string;
}

export class AirtelAuthenticateResponseBodySuccessDto {
  public access_token: string;
  public expires_in: number;
  public token_type: string;
}

export class AirtelAuthenticateResponseBodyFailDto {
  public error_description: string;
  public error: string;
}

// Disbursement V1
class AirtelDisbursementV1PayloadPayeeDto {
  @ApiProperty({ example: '123456789' })
  public msisdn: string;
}

class AirtelDisbursementV1PayloadTransactionDto {
  @ApiProperty({ example: 0.1 })
  public amount: number;
  @ApiProperty({ example: uuid() })
  public id: string;
}

export class AirtelDisbursementV1PayloadDto {
  @ApiProperty()
  public payee: AirtelDisbursementV1PayloadPayeeDto;
  @ApiProperty({ example: uuid() })
  @ApiProperty({ example: uuid() })
  public reference: string;
  @ApiProperty({ example: 'not-really-encrypted' })
  public pin: string;
  @ApiProperty()
  public transaction: AirtelDisbursementV1PayloadTransactionDto;
}

class AirtelDisbursementV1ResponseSuccessBodyDataTransactionDto {
  //
  @ApiProperty({ example: 'CI250506.1824.H00006' })
  public reference_id: string;
}

class AirtelDisbursementV1ResponseSuccessBodyDataDto {
  @ApiProperty()
  public payee: AirtelDisbursementV1ResponseSuccessBodyDataTransactionDto;
}

export class AirtelDisbursementV1ResponseSuccessBodyDto {
  @ApiProperty()
  public body: AirtelDisbursementV1ResponseSuccessBodyDataDto;
}

// Disbursement V3
class AirtelDisbursementV3PayloadPayeeDto {
  @ApiProperty({ example: '123456789' })
  public msisdn: string;
  @ApiProperty({ example: 'NORMAL' })
  public wallet_type: string;
}

class AirtelDisbursementV3PayloadTransactionDto {
  @ApiProperty({ example: 0.1 })
  public amount: number;
  @ApiProperty({ example: uuid() })
  public id: string;
  @ApiProperty({ example: 'B2C' })
  public type: string;
}

export class AirtelDisbursementV3PayloadDto {
  @ApiProperty()
  public payee: AirtelDisbursementV3PayloadPayeeDto;
  @ApiProperty({
    example: uuid(),
    type: 'string',
  })
  @ApiProperty({ example: uuid() })
  public reference: string;
  @ApiProperty({ example: 'not-really-encrypted' })
  public pin: string;
  @ApiProperty()
  public transaction: AirtelDisbursementV3PayloadTransactionDto;
}

class AirtelDisbursementV3ResponseSuccessBodyDataTransactionDto {
  //
  @ApiProperty({ example: 'CI250506.1824.H00006' })
  public reference_id: string;
}

class AirtelDisbursementV3ResponseSuccessBodyDataDto {
  @ApiProperty()
  public payee: AirtelDisbursementV3ResponseSuccessBodyDataTransactionDto;
}

export class AirtelDisbursementV3ResponseSuccessBodyDto {
  @ApiProperty()
  public body: AirtelDisbursementV3ResponseSuccessBodyDataDto;
}
