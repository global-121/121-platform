import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiModelProperty({ example: 'test@example.org' })
  @IsNotEmpty()
  public readonly email: string;

  @ApiModelProperty()
  @IsNotEmpty()
  public readonly password: string;
}
