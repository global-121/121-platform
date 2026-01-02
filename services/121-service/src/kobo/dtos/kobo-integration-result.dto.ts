import { ApiProperty } from '@nestjs/swagger';

export class KoboIntegrationResultDto {
  @ApiProperty({
    example: 'Integration completed successfully',
    description: 'Result message describing the outcome of the integration',
  })
  public readonly message: string;

  @ApiProperty({
    example: false,
    description:
      'Whether this was a dry run (validation only) or actual integration',
  })
  public readonly dryRun: boolean;
}
