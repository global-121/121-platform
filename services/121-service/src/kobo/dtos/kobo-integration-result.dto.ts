import { ApiProperty } from '@nestjs/swagger';

export class KoboIntegrationResultDto {
  @ApiProperty({
    example: 'Integration completed successfully',
    description: 'Result message describing the outcome of the integration',
  })
  public readonly message: string;

  @ApiProperty({
    example: 'Kobo Form',
    description: 'The name of the Kobo form',
    nullable: true,
  })
  public readonly name: string | null;

  @ApiProperty({
    example: true,
    description:
      'Whether the refresh applied changes to the program. False when the Kobo form was already up to date.',
    required: false,
  })
  public readonly updated?: boolean;
}
