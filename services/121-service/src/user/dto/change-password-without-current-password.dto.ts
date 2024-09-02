import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class changePasswordWithoutCurrentPasswordDto {
  @ApiProperty({ example: 'user@example.org' })
  @IsNotEmpty()
  @IsEmail()
  public readonly username: string;
}
