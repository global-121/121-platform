import { ApiProperty } from '@nestjs/swagger';

class CooperativeBankOfOromiaDisbursementV2ResponseSuccessDataTransactionDto {
  //
  @ApiProperty({ example: 'CI250506.1824.H00006' })
  public reference_id: string;
}

class CooperativeBankOfOromiaDisbursementV2ResponseSuccessDataDto {
  @ApiProperty()
  public payee: CooperativeBankOfOromiaDisbursementV2ResponseSuccessDataTransactionDto;
}

export class CooperativeBankOfOromiaDisbursementV2ResponseSuccessDto {
  @ApiProperty()
  public body: CooperativeBankOfOromiaDisbursementV2ResponseSuccessDataDto;
}
