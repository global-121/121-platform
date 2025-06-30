import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface SafaricomTransactionJobDto extends SharedTransactionJobDto {
  readonly referenceId: string;
  readonly transactionAmount: number;
  readonly bulkSize: number;
  readonly originatorConversationId: string;
  readonly phoneNumber: string;
  readonly idNumber: string;
}
