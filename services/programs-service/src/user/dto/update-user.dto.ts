import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class UpdateUserDto {

  @ApiModelProperty()
  @IsNotEmpty()
  readonly username: string;
  
  @ApiModelProperty()
  @IsNotEmpty()
  readonly email: string;
}