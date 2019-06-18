import { ApiModelProperty } from '@nestjs/swagger';

export class CreateOptionDto {
  @ApiModelProperty({ example: 'test' })
  readonly option: string;
}
