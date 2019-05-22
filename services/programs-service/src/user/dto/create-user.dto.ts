import { IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiModelProperty()
  @IsNotEmpty()
  readonly username: string;

  @ApiModelProperty({example: "test@test.nl"})
  @IsNotEmpty()
  readonly email: string;

  @ApiModelProperty()
  @IsNotEmpty()
  readonly password: string;

  @ApiModelProperty({example: "admin / aidworker"})
  readonly role: string;

  @ApiModelProperty({example: 1})
  readonly countryId: number;
}