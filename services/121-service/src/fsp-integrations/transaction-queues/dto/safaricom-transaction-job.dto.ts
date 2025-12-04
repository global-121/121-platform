import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';

export interface SafaricomTransactionJobDto extends SharedTransactionJobDto {
  readonly idNumber: string;
  readonly phoneNumber: string;
}
