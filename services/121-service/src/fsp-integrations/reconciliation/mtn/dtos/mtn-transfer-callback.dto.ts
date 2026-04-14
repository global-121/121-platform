import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class MtnTransferCallbackDto {
  @ApiProperty({
    description:
      'The external ID that was provided in the original transfer request (maps to transactionId).',
  })
  @IsNotEmpty()
  @IsNumberString()
  readonly externalId: string;

  @ApiProperty({
    description:
      'The reference ID (UUID) used as X-Reference-Id in the original transfer request.',
  })
  @IsNotEmpty()
  @IsString()
  readonly referenceId: string;

  @ApiProperty({
    description: 'The status of the transfer: SUCCESSFUL, FAILED, or PENDING.',
  })
  @IsNotEmpty()
  @IsString()
  readonly status: string;

  @ApiProperty({
    description: 'The reason for failure, if status is FAILED.',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly reason?: string;
}
