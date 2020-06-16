import { ApiModelProperty } from '@nestjs/swagger';

import { Length } from 'class-validator';

export class DidProgramIdDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 1 })
  public readonly programId: number;
}
