import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsNotEmpty, IsString } from 'class-validator';

export class GraphFileAttachmentDto {
  @ApiProperty({ example: '#microsoft.graph.fileAttachment' })
  @Equals('#microsoft.graph.fileAttachment')
  public readonly '@odata.type': '#microsoft.graph.fileAttachment';

  @ApiProperty({ example: 'report.pdf' })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({ example: 'base64encodedcontent' })
  @IsString()
  @IsNotEmpty()
  public readonly contentBytes: string;
}
