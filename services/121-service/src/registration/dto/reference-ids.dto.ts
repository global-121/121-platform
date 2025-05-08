import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class ReferenceIdsDto {
  @ApiProperty({
    example: [
      '910c50be-f131-4b53-b06b-6506a40a2734',
      '910c50be-f131-4b53-b06b-6506a40a2735',
    ],
  })
  @IsArray()
  public readonly referenceIds: string[];
}
