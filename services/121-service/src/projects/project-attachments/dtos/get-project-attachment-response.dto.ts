import { ApiProperty } from '@nestjs/swagger';

export class GetProjectAttachmentResponseDto {
  @ApiProperty({ example: 1, type: 'number' })
  public readonly id: number;

  @ApiProperty({ example: new Date() })
  public readonly created: Date;

  @ApiProperty({ example: new Date() })
  public readonly updated: Date;

  @ApiProperty({ example: 1, type: 'number' })
  public readonly projectId: number;

  @ApiProperty({ example: { id: 1, username: 'user@example.org' } })
  public readonly user: {
    id: number;
    username?: string | null;
    displayName?: string;
  };

  @ApiProperty({ example: 'Image123.png', type: 'string' })
  public readonly filename: string;

  @ApiProperty({ example: 'image/png', type: 'string' })
  public readonly mimetype: string;
}
