import { ApiProperty } from '@nestjs/swagger';

export class CreateProgramAttachmentResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public readonly id: number;
}
