import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class DeleteSentEmailsQueryDto {
  @ApiPropertyOptional({
    example: 'user@example.org',
    description: 'When omitted, the sent emails of all recipients are deleted.',
  })
  @IsOptional()
  @IsEmail()
  public readonly recipient?: string;
}
