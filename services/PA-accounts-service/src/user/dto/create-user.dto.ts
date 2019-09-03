import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiModelProperty()
  @IsNotEmpty()
  readonly username: string;

  @ApiModelProperty({ example: 'admin@test.nl' })
  @IsNotEmpty()
  readonly email: string;

  @ApiModelProperty()
  @IsNotEmpty()
  readonly password: string;

}
