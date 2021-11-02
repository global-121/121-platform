import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiModelProperty({ example: 'full-access-user@example.org' })
  @IsNotEmpty()
  public readonly username: string;

  @ApiModelProperty({ example: 'password' })
  @IsNotEmpty()
  public readonly password: string;
}
