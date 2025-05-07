import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';

export class AirtelAuthenticateBodyDto {
  @ApiProperty({ example: uuid(), type: 'string' })
  public client_id: string;
  @ApiProperty({ example: uuid(), type: 'string' })
  public client_secret: string;
  @ApiProperty({ example: 'client_credentials', type: 'string' })
  public grant_type: string;
}

export class AirtelAuthenticateResponseBodySuccessDto {
  // @ApiProperty({ example: 'FjE953LG40P0hdehYEiSkUd0hGWshyFf', type: 'string' })
  public access_token: string;
  // @ApiProperty({ example: 180, type: 'number' })
  public expires_in: number;
  // @ApiProperty({ example: 'bearer', type: 'string' })
  public token_type: string;
}

export class AirtelAuthenticateResponseBodyFailDto {
  public error_description: string;
  public error: string;
}

class AirtelDisbursementV1PayloadPayeeDto {
  @ApiProperty({ example: '123456789', type: 'string' })
  public readonly msisdn: string;
}

class AirtelDisbursementV1PayloadTransactionDto {
  @ApiProperty({ example: 0.1, type: 'number' })
  public readonly amount: number;
  @ApiProperty({ example: uuid(), type: 'string' })
  public readonly id: string;
}

export class AirtelDisbursementV1PayloadDto {
  @ApiProperty()
  public payee: AirtelDisbursementV1PayloadPayeeDto;
  @ApiProperty({
    example: uuid(),
    type: 'string',
  })
  @ApiProperty({ example: uuid(), type: 'string' })
  public reference: string;
  @ApiProperty({ example: 'not-really-encrypted', type: 'string' })
  public pin: string;
  @ApiProperty()
  public transaction: AirtelDisbursementV1PayloadTransactionDto;
}

class AirtelDisbursementV1ResponseSuccessBodyDataTransactionDto {
  //
  @ApiProperty({ example: 'CI250506.1824.H00006', type: 'string' })
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
