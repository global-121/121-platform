import { ApiProperty } from '@nestjs/swagger';

export class ActivityInfoResponseDto {
  @ApiProperty({
    example: 'cqlnfvvmel72a2ka',
    type: 'string',
    description: 'ActivityInfo form id',
  })
  public readonly formId: string;

  @ApiProperty({
    example: '42',
    type: 'string',
    description: 'Schema version of the integrated ActivityInfo form',
  })
  public readonly schemaVersion: string;

  @ApiProperty({
    example: '2026-09-02T10:30:00Z',
    type: 'string',
    format: 'date-time',
    description:
      'Timestamp when this ActivityInfo integration record was last updated in 121 Platform',
  })
  public readonly updated: Date;

  @ApiProperty({
    example: 'https://www.activityinfo.org',
    type: 'string',
    description: 'ActivityInfo server URL',
  })
  public readonly url: string;

  @ApiProperty({
    example: 1,
    type: 'number',
    description: 'ID of the associated program',
  })
  public readonly programId: number;

  @ApiProperty({
    example: 'Household registration',
    type: 'string',
    description: 'Label of the ActivityInfo form',
    nullable: true,
  })
  public readonly name: string | null;
}
