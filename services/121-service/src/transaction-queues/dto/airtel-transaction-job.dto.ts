import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface AirtelTransactionJobDto extends SharedTransactionJobDto {
  readonly phoneNumber: string;
}
