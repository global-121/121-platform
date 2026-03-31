import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
