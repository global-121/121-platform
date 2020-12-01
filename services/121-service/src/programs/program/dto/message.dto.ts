import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsString } from 'class-validator';

export class MessageDto {
  @ApiModelProperty({ example: 'Rejection message' })
  @Length(20, 160)
  @IsString()
  public readonly message: string;
}
