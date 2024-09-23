import { ApiProperty } from '@nestjs/swagger';

import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';

export class ReconciliationFeedbackDto {
  @ApiProperty({ example: '1234', description: 'The reference ID' })
  referenceId?: string | null;

  @ApiProperty({
    example: StatusEnum.success,
    enum: StatusEnum,
  })
  status?: StatusEnum | null;

  @ApiProperty({ example: 'Success', description: 'The message' })
  message?: string | null;

  @ApiProperty({
    example: ImportStatus.imported,
    enum: ImportStatus,
  })
  importStatus: ImportStatus;

  [key: string]: string | undefined | null | ImportStatus;
}
