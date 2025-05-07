import { ApiProperty } from '@nestjs/swagger';

class AirtelDisbursementV2ResponseSuccessDataTransactionDto {
  //
  @ApiProperty({ example: 'CI250506.1824.H00006' })
  public reference_id: string;
}

class AirtelDisbursementV2ResponseSuccessDataDto {
  @ApiProperty()
  public payee: AirtelDisbursementV2ResponseSuccessDataTransactionDto;
}

export class AirtelDisbursementV2ResponseSuccessDto {
  @ApiProperty()
  public body: AirtelDisbursementV2ResponseSuccessDataDto;
}
