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
}
