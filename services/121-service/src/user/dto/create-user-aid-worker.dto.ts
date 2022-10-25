import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserAidWorkerDto {
  @ApiProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsEmail()
  public readonly email: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  @MinLength(8)
  public readonly password: string;
}
