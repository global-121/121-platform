import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsNotEmpty, IsNumber } from 'class-validator';

export class DidProgramDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly programId: number;
}
