import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { GraphFileAttachmentDto } from '@mock-service/src/email/dto/graph-file-attachment.dto';
import { GraphRecipientDto } from '@mock-service/src/email/dto/graph-recipient.dto';

export class GraphMessageBodyDto {
  @ApiProperty({ example: 'HTML' })
  @Equals('HTML')
  public readonly contentType: 'HTML';

  @ApiProperty({ example: '<p>Hello, welcome to the platform.</p>' })
  @IsString()
  @IsNotEmpty()
  public readonly content: string;
}

export class GraphMessageDto {
  @ApiProperty({ example: 'Your account has been created' })
  @IsString()
  @IsNotEmpty()
  public readonly subject: string;

  @ApiProperty({ type: GraphMessageBodyDto })
  @ValidateNested()
  @Type(() => GraphMessageBodyDto)
  public readonly body: GraphMessageBodyDto;

  @ApiProperty({ type: [GraphRecipientDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GraphRecipientDto)
  public readonly toRecipients: GraphRecipientDto[];

  @ApiPropertyOptional({ type: [GraphFileAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GraphFileAttachmentDto)
  public readonly attachments?: GraphFileAttachmentDto[];
}

export class SendMailRequestDto {
  @ApiProperty({ type: GraphMessageDto })
  @ValidateNested()
  @Type(() => GraphMessageDto)
  public readonly message: GraphMessageDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  public readonly saveToSentItems?: boolean;
}
