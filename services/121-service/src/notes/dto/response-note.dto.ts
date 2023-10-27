import { ApiProperty } from '@nestjs/swagger';

export class ResponseNoteDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;
  @ApiProperty({ example: 'note here' })
  public readonly text: string;
  @ApiProperty({ example: 1 })
  public readonly registrationId: number;
  @ApiProperty({ example: 1 })
  public readonly userId: number;
  @ApiProperty({ example: new Date() })
  public readonly created: Date;
  @ApiProperty({ example: 'username' })
  public readonly username: string;
}
