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
    example: 42,
    description: 'The current number of submissions in the Kobo form',
  })
  public readonly submissionCount: number;
}
