import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface ExcelTransactionJobDto extends SharedTransactionJobDto {
  readonly transactionAmount: number;
}
