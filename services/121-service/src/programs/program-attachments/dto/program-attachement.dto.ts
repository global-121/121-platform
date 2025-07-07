import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateProgramAttachmentDto {
  @ApiProperty({ example: 'programAttachment here' })
  @IsString()
  public readonly text: string;
}
