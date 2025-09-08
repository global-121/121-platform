import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface NedbankTransactionJobDto extends SharedTransactionJobDto {
  readonly phoneNumber: string;
  readonly transactionAmount: number;
  readonly phoneNumber: string;
}
