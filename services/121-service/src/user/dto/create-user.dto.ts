import { IsNotEmpty, IsEnum, MinLength, IsEmail } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { UserRole } from '../../user-role.enum';

export class CreateUserDto {
  @ApiModelProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string;

  @ApiModelProperty()
  @IsNotEmpty()
  @MinLength(8)
  public readonly password: string;

  @ApiModelProperty({
    example: 'admin / aidworker / project-officer / program-manager',
  })
  @IsEnum(UserRole)
  public readonly role: string;

  @ApiModelProperty({ example: 'active' })
  public readonly status: string;
}
