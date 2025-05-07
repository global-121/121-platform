import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'note here' })
  @IsString()
  public readonly text: string;
}
