import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsNotEmpty, IsNumber } from 'class-validator';

export class ReferenceIdProgramDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly programId: number;
}
