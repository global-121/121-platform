import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface SafaricomTransactionJobDto extends SharedTransactionJobDto {
  readonly originatorConversationId: string;
  readonly idNumber: string;
  readonly phoneNumber: string;
}
