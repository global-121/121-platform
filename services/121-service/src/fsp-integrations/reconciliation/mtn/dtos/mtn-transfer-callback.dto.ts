import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';

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
  @IsOptional()
  readonly referenceId: string;

  @ApiProperty({
    description: 'The status of the transfer: SUCCESSFUL, FAILED, or PENDING.',
    enum: MtnTransferStatus,
  })
  @IsNotEmpty()
  @IsEnum(MtnTransferStatus)
  readonly status: MtnTransferStatus;

  @ApiProperty({
    description: 'The reason for failure, if status is FAILED.',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly reason?: string;
}
