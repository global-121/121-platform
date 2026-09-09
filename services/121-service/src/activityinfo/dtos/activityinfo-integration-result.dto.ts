import { ApiProperty } from '@nestjs/swagger';

export class ActivityInfoIntegrationResultDto {
  @ApiProperty({
    example: 'ActivityInfo form integrated successfully',
    description: 'Result message describing the outcome of the integration',
  })
  public readonly message: string;

  @ApiProperty({
    example: 'Household registration',
    description: 'The label of the ActivityInfo form',
    nullable: true,
  })
  public readonly name: string | null;

  @ApiProperty({
    example: true,
    description:
      'Whether the refresh applied changes to the program. False when the ActivityInfo form schema was already up to date.',
    required: false,
  })
  public readonly updated?: boolean;
}
