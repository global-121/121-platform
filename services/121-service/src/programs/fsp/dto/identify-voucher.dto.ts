import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsNumber } from 'class-validator';

export class IdentifyVoucherDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly installment: number;
}
