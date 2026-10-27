import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLoginOtpDto {
  @ApiProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsString()
  public readonly username: string;
}
