import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginWithOtpDto {
  @ApiProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsString()
  public readonly username: string;

  @ApiProperty({ example: '4A1RQ9' })
  @IsNotEmpty()
  @IsString()
  public readonly otp: string;
}
