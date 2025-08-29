import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectAttachmentResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public readonly id: number;
}
