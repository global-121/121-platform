import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class changePasswordWithoutCurrentPasswordDto {
  @ApiProperty({ example: 'user@example.org' })
  @IsNotEmpty()
  public readonly username: string;

  @ApiProperty({ example: 'newPassword' })
  @IsNotEmpty()
  public readonly password: string;
}
