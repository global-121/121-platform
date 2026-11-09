import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLoginOneTimePasswordDto {
  @ApiProperty({ example: 'admin@example.org' })
  @IsNotEmpty()
  @IsString()
  public readonly username: string;
}
