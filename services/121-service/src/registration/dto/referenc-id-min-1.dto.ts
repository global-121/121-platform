import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray } from 'class-validator';

export class ReferenceIdsMin1Dto {
  @ApiProperty({
    example: [
      '910c50be-f131-4b53-b06b-6506a40a2736',
      '910c50be-f131-4b53-b06b-6506a40a2737',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  public readonly referenceIds: string[];
}
