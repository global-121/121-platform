import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  public readonly username: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  public readonly password: string;
}
