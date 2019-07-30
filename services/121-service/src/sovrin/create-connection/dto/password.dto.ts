import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString } from 'class-validator';

export class PasswordDto {
  @ApiModelProperty({ example: 'password' })
  @IsNotEmpty()
  @IsString()
  public readonly password: string;
}
