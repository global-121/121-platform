import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class EmailAttachmentDto {
  @ApiProperty({ example: 'report.pdf' })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({ example: 'base64encodedcontent' })
  @IsString()
  @IsNotEmpty()
  public readonly contentBytes: string;
}

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
