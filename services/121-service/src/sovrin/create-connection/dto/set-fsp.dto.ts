import { Length, IsNumber } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class SetFspDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly fspId: number;
}
