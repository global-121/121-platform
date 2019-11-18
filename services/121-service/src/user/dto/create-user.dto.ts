import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiModelProperty()
  @IsNotEmpty()
  readonly username: string;

  @ApiModelProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  readonly email: string;

  @ApiModelProperty()
  @IsNotEmpty()
  readonly password: string;

  @ApiModelProperty({ example: 'admin / aidworker / program-manager' })
  readonly role: string;

  @ApiModelProperty({ example: 'active' })
  readonly status: string;

  @ApiModelProperty({ example: 1 })
  readonly countryId: number;
}
