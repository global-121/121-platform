import { IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
