import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { LoginUserDto } from './login-user.dto';

export class UpdateUserDto extends LoginUserDto {
  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  public readonly newPassword: string;
}
