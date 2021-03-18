import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiModelProperty({ example: 'test-pa' })
  @IsNotEmpty()
  public readonly username: string;

  @ApiModelProperty()
  @IsNotEmpty()
  public readonly password: string;
}
