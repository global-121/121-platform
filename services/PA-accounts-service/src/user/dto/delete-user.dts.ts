import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class DeleteUserDto {
  @ApiModelProperty()
  @IsNotEmpty()
  readonly password: string;

}
