import { ApiProperty } from '@nestjs/swagger';

export class ProgramAttachmentAccessGroupResponseDto {
  @ApiProperty({ example: 'county', type: 'string' })
  public readonly programRegistrationAttributeName: string;

  @ApiProperty({ example: 'kisumu', type: 'string' })
  public readonly value: string;
}
