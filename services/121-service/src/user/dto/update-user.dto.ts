import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { LoginUserDto } from './login-user.dto';

export class UpdateUserPasswordDto extends LoginUserDto {
  @ApiProperty({ example: 'newPassword' })
  @IsNotEmpty()
  public readonly newPassword: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  public readonly id: number;
  @ApiProperty({ example: true })
  @IsNotEmpty()
  public readonly isEntraUser: boolean;
}
