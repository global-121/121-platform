import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsString, IsNotEmpty } from 'class-validator';

export class UpdateNoteDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({ example: 'note here' })
  @IsString()
  public readonly note: string;
}
