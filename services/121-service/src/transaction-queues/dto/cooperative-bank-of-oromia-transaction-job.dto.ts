import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface CooperativeBankOfOromiaTransactionJobDto
  extends SharedTransactionJobDto {
  readonly bankAccountNumber: string;
}
