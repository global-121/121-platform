import { IsArray, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReferenceIdDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
}

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
