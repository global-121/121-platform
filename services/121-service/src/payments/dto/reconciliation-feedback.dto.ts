import { ApiProperty } from '@nestjs/swagger';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';

export class ReconciliationFeedbackDto {
  // TODO align with guidelines: use the dto only for the endpoint response, and don't pass it along multiple methods > create new interfaces for that + split in files where appropriate
  @ApiProperty({ example: '1234', description: 'The reference ID' })
  referenceId?: string | null;

  @ApiProperty({
    example: TransactionStatusEnum.success,
    enum: TransactionStatusEnum,
  })
  status?: TransactionStatusEnum | null;

  @ApiProperty({ example: 'Success', description: 'The message' })
  message?: string | null;

  @ApiProperty({
    example: ImportStatus.imported,
    enum: ImportStatus,
  })
  importStatus: ImportStatus;

  [key: string]: string | undefined | null | ImportStatus;
}
