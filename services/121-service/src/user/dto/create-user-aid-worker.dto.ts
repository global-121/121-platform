import { IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateUserAidWorkerDto {
  @ApiModelProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string;

  @ApiModelProperty({ example: 'password' })
  @IsNotEmpty()
  @MinLength(8)
  public readonly password: string;
}
