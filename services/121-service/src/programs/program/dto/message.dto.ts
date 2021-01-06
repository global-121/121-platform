import { ApiModelProperty } from '@nestjs/swagger';

import { IsString, IsOptional, MinLength } from 'class-validator';

export class MessageDto {
  @ApiModelProperty({ example: 'Rejection message' })
  @MinLength(20)
  @IsString()
  @IsOptional()
  public readonly message: string;
}
