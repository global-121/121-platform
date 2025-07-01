import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface OnafriqTransactionJobDto extends SharedTransactionJobDto {
  readonly referenceId: string;
  readonly transactionAmount: number;
  readonly bulkSize: number;
  readonly phoneNumber: string;
  readonly firstName: string;
  readonly lastName: string;
}
