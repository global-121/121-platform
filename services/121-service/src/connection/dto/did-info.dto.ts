import { IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class DidInfoDto {
  @ApiModelProperty({ example: 'encrypted:example' })
  @IsNotEmpty()
  @IsString()
  public readonly message: string;
}
