import { IsNotEmpty, IsEnum, MinLength } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { UserRole } from '../../user-role.enum';
import { MinKey } from 'typeorm';

export class CreateUserDto {
  @ApiModelProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  public readonly email: string;

  @ApiModelProperty()
  @IsNotEmpty()
  @MinLength(8)
  public readonly password: string;

  @ApiModelProperty({ example: 'admin / aidworker / program-manager' })
  @IsEnum(UserRole)
  public readonly role: string;

  @ApiModelProperty({ example: 'active' })
  public readonly status: string;

  @ApiModelProperty({ example: 1 })
  public readonly countryId: number;
}
