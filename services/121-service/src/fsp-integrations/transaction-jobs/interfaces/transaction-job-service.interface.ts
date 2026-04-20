import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';

export interface TransactionJobService<T extends SharedTransactionJobDto> {
  processTransactionJob: (data: T) => Promise<void>;
}
