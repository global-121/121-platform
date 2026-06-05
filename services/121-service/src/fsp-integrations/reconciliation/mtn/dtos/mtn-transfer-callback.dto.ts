import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

// NOTE: All fields use @IsOptional() because we don't control what MTN sends.
// Strict validation would silently return 400 with no server-side logging,
// causing us to drop callbacks. Validation happens in the service layer instead.
export class MtnTransferCallbackDto {
  @ApiProperty({
    description:
      'The external ID that was provided in the original transfer request (maps to transactionId).',
  })
  @IsOptional()
  readonly externalId?: string;

  @ApiProperty({
    description:
      'The reference ID (UUID) used as X-Reference-Id in the original transfer request.',
  })
  @IsOptional()
  readonly referenceId?: string;

  @ApiProperty({
    description: 'The status of the transfer: SUCCESSFUL, FAILED, or PENDING.',
  })
  @IsOptional()
  readonly status?: string;

  @ApiProperty({
    description: 'The reason for failure, if status is FAILED.',
    required: false,
  })
  @IsOptional()
  readonly reason?: string;
}
