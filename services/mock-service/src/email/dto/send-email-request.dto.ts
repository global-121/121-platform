import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { EmailAttachmentDto } from '@mock-service/src/email/dto/email-attachment.dto';

export class SendEmailRequestDto {
  @ApiProperty({ example: 'user@example.org' })
  @IsEmail()
  public readonly email: string;

  @ApiProperty({ example: 'Your account has been created' })
  @IsString()
  @IsNotEmpty()
  public readonly subject: string;

  @ApiProperty({ example: '<p>Hello, welcome to the platform.</p>' })
  @IsString()
  @IsNotEmpty()
  public readonly body: string;

  @ApiPropertyOptional({ type: EmailAttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailAttachmentDto)
  public readonly attachment?: EmailAttachmentDto;
}
