import { ApiProperty } from '@nestjs/swagger';

export class KoboResponseDto {
  @ApiProperty({
    example: 'aAbBcCdDeEfF123456789',
    type: 'string',
    description: 'Kobo asset ID',
  })
  public readonly assetId: string;

  @ApiProperty({
    example: 'vAbBcCdDeEfF987654321',
    type: 'string',
    description: 'Kobo form version ID',
  })
  public readonly versionId: string;

  @ApiProperty({
    // example: new Date().toISOString(),
    type: 'string',
    format: 'date-time',
    description: 'Date the Kobo form was deployed',
  })
  public readonly dateDeployed: Date;

  @ApiProperty({
    example: 'https://kobo.example.org',
    type: 'string',
    description: 'Kobo server URL',
  })
  public readonly url: string;

  @ApiProperty({
    example: 1,
    type: 'number',
    description: 'ID of the associated program',
  })
  public readonly programId: number;
}
