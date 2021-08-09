import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateUserPersonAffectedDto {
  @ApiModelProperty({ example: 'test-pa' })
  @IsNotEmpty()
  public readonly username: string;

  @ApiModelProperty()
  @IsNotEmpty()
  @MinLength(4)
  public readonly password: string;
}
