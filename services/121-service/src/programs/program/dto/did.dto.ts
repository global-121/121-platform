import { ApiModelProperty } from '@nestjs/swagger';

import { Length } from 'class-validator';

export class DidDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
}
