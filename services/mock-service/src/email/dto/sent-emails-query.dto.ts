import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SentEmailsQueryDto {
  @ApiProperty({ example: 'user@example.org' })
  @IsEmail()
  public readonly recipient: string;
}
