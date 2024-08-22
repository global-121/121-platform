import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

class UserEmailDto {
  @ApiProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string;
}

export class CreateUsersDto {
  @ApiProperty({ type: [UserEmailDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UserEmailDto)
  public readonly users: UserEmailDto[];
}
