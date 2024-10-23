import { ApiProperty } from '@nestjs/swagger';

import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';

export class ReconciliationFeedbackDto {
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
  importStatus?: ImportStatus;

  // ## TODO swagger decorators not needed here right?
  programFinancialServiceProviderConfigurationId?: number;

  transaction?: PaTransactionResultDto;

  [key: string]:
    | string
    | undefined
    | null
    | ImportStatus
    | number
    | PaTransactionResultDto;
}
