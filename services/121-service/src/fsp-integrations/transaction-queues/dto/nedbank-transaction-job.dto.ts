import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';

export interface NedbankTransactionJobDto extends SharedTransactionJobDto {
  readonly phoneNumber: string;
}
