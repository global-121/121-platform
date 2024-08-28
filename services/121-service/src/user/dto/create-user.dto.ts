import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class UserEmailDto {
  @ApiProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsEmail()
  public readonly username: string;

  @ApiProperty({
    example: 'admin',
    description:
      'Optional. If not supplied, the part of the email before the @ is used.',
  })
  @IsOptional()
  @IsString()
  public readonly displayName: string;
}

export class CreateUsersDto {
  @ApiProperty({ type: [UserEmailDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UserEmailDto)
  public readonly users: UserEmailDto[];
}
