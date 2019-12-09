import { Length } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class DidDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
}
