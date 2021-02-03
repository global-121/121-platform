import { IsNotEmpty, MinLength, IsEmail, IsArray } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { UserRole } from '../../user-role.enum';

export class CreateUserDto {
  @ApiModelProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string;

  @ApiModelProperty({ example: 'password' })
  @IsNotEmpty()
  @MinLength(8)
  public readonly password: string;

  @ApiModelProperty({
    example: [
      UserRole.Admin,
      UserRole.FieldValidation,
      UserRole.PersonalData,
      UserRole.RunProgram,
    ],
  })
  @IsArray()
  public readonly roles: UserRole[];
}
