import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsString } from 'class-validator';

export class ReferenceIdDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
}

export class ReferenceIdsDto {
  @ApiModelProperty({
    example:
      '["910c50be-f131-4b53-b06b-6506a40a2734", "910c50be-f131-4b53-b06b-6506a40a2735"]',
  })
  @IsString()
  public readonly referenceIds: string;
}
